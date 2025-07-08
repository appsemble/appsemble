import { randomUUID } from 'node:crypto';
import { createReadStream, createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { pipeline } from 'node:stream/promises';

import { AppValidator, validateAppDefinition } from '@appsemble/lang-sdk';
import {
  AppsembleError,
  assertKoaCondition,
  getSupportedLanguages,
  handleValidatorResult,
  type TempFile,
  uploadS3File,
} from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { normalize, validateStyle } from '@appsemble/utils';
import JSZip from 'jszip';
import { type Context } from 'koa';
import { lookup } from 'mime-types';
import webpush from 'web-push';
import { parse } from 'yaml';

import {
  App,
  AppBlockStyle,
  AppMessages,
  AppSnapshot,
  Asset,
  BlockVersion,
  Resource,
  transactional,
} from '../../../../models/index.js';
import { options } from '../../../../options/options.js';
import {
  createAppReadmes,
  createAppScreenshots,
  handleAppValidationError,
  setAppPath,
} from '../../../../utils/app.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';
import { getBlockVersions } from '../../../../utils/block.js';
import { createDynamicIndexes } from '../../../../utils/dynamicIndexes.js';
import { processHooks, processReferenceHooks } from '../../../../utils/resource.js';

export async function importApp(ctx: Context): Promise<void> {
  const {
    pathParams: { organizationId },
    request: { body: importFile },
  } = ctx;

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId,
    requiredPermissions: [OrganizationPermission.CreateApps],
  });

  let result: Partial<App> = {};
  // TODO: assert that some file/folder structure is present in the zip file
  const zip = await JSZip.loadAsync(importFile);
  try {
    const definitionFile = zip.file('app-definition.yaml');
    assertKoaCondition(
      definitionFile != null,
      ctx,
      400,
      'app-definition.yaml file not found in the zip file',
    );

    const yaml = await definitionFile.async('text');
    const theme = zip.folder('theme');
    const definition = parse(yaml, { maxAliasCount: 10_000 });

    const appValidator = new AppValidator();
    handleValidatorResult(ctx, appValidator.validateApp(definition), 'App validation failed');
    handleValidatorResult(
      ctx,
      await validateAppDefinition(definition, getBlockVersions),
      'App validation failed',
    );

    const path = normalize(definition.name);
    const icon = await zip.file('icon.png')?.async('nodebuffer');
    const keys = webpush.generateVAPIDKeys();
    result = {
      definition,
      path,
      OrganizationId: organizationId,
      vapidPublicKey: keys.publicKey,
      vapidPrivateKey: keys.privateKey,
      showAppsembleLogin: false,
      displayAppMemberName: false,
      displayInstallationPrompt: false,
      showAppsembleOAuth2Login: true,
      enableSelfRegistration: true,
      showAppDefinition: true,
      template: false,
      icon,
      iconBackground: '#ffffff',
    };
    await setAppPath(ctx, result, path);
    const coreStyleFile = theme?.file('core/index.css');
    if (coreStyleFile) {
      const coreStyle = await coreStyleFile.async('text');
      result.coreStyle = validateStyle(coreStyle);
    }
    const sharedStyleFile = theme?.file('shared/index.css');
    if (sharedStyleFile) {
      const sharedStyle = await sharedStyleFile.async('text');
      result.sharedStyle = validateStyle(sharedStyle);
    }

    let rec: App;
    try {
      let record: App | undefined;
      await transactional(async (transaction) => {
        record = await App.create(result, { transaction });
        record.AppSnapshots = [
          await AppSnapshot.create({ AppId: record.id, yaml }, { transaction }),
        ];

        const i18Folder = zip.folder('i18n')?.filter((filename) => filename.endsWith('json')) ?? [];
        for (const json of i18Folder) {
          const language = json.name.slice(5, 7);
          const messages = await json.async('text');
          record.AppMessages = [
            await AppMessages.create(
              { AppId: record.id, language, messages: JSON.parse(messages) },
              { transaction },
            ),
          ];
        }

        const appId = record.id;

        const resourcesFolder =
          zip.folder('resources')?.filter((filename) => filename.endsWith('json')) ?? [];
        if (resourcesFolder.length) {
          Object.entries(record.definition.resources ?? {}).map(
            ([resourceType, { enforceOrderingGroupByFields, positioning }]) => {
              if (positioning && enforceOrderingGroupByFields) {
                createDynamicIndexes(
                  enforceOrderingGroupByFields,
                  record!.id,
                  resourceType,
                  transaction,
                );
              }
            },
          );
        }

        for (const file of resourcesFolder) {
          const [, resourceJsonName] = file.name.split('/');
          const [resourceType] = resourceJsonName.split('.');
          const resourcesText = await file.async('text');
          const resources = JSON.parse(resourcesText);

          const createdResources = await Resource.bulkCreate(
            resources.map(
              ({
                $clonable,
                $ephemeral,
                $seed,
                ...data
              }: {
                data: Record<string, any>;
                $seed: boolean;
                $ephemeral: boolean;
                $clonable: boolean;
              }) => ({
                AppId: appId,
                type: resourceType,
                seed: $seed,
                ephemeral: $ephemeral,
                clonable: $clonable,
                data,
              }),
            ),
            { logging: false, transaction },
          );

          processReferenceHooks(record, createdResources[0], 'create', options, ctx);
          processHooks(record, createdResources[0], 'create', options, ctx);
        }

        for (const jsZipObject of zip
          .folder('assets')
          ?.filter((filename) => !['.DS_Store'].includes(filename)) ?? []) {
          if (!jsZipObject.dir) {
            const { name } = jsZipObject;

            const tempPath = join(tmpdir(), `${Date.now()}-${randomUUID()}`);
            const fileWriteStream = createWriteStream(tempPath);
            await pipeline(jsZipObject.nodeStream(), fileWriteStream);
            const stats = await stat(tempPath);

            const asset = await Asset.create(
              {
                AppId: record.id,
                filename: name,
                mime: lookup(name),
              },
              { transaction },
            );

            await uploadS3File(`app-${appId}`, asset.id, createReadStream(tempPath), stats.size);
          }
        }

        const supportedLanguages = await getSupportedLanguages();
        const screenshots: TempFile[] = [];
        for (const jsZipObject of zip
          .folder('screenshots')
          ?.filter((filename) => !['.DS_Store'].includes(filename)) ?? []) {
          if (!jsZipObject.dir) {
            const { name } = jsZipObject;
            const contents = await jsZipObject.async('nodebuffer');

            const screenshotDirectoryPath = dirname(name);
            const screenshotDirectoryName = basename(screenshotDirectoryPath);

            const language = supportedLanguages.has(screenshotDirectoryName)
              ? screenshotDirectoryName
              : 'unspecified';

            const uploadsPath = join(tmpdir(), 'screenshots');
            if (!existsSync(uploadsPath)) {
              mkdirSync(uploadsPath);
            }

            const languagePath = join(uploadsPath, language);
            if (!existsSync(languagePath)) {
              mkdirSync(languagePath);
            }

            const screenshotPath = join(languagePath, basename(name));
            await writeFile(screenshotPath, contents);

            screenshots.push({
              filename: `${language}-${name}`,
              mime: lookup(name) || '',
              path: screenshotPath,
            });
          }
        }

        await createAppScreenshots(record.id, screenshots, transaction, ctx);

        const readmeFiles: TempFile[] = [];
        for (const jsZipObject of zip.filter(
          (filename) => filename.toLowerCase().startsWith('readme') && filename.endsWith('md'),
        )) {
          const { name } = jsZipObject;
          const contents = await jsZipObject.async('nodebuffer');

          const uploadsPath = join(tmpdir(), 'readmes');
          if (!existsSync(uploadsPath)) {
            mkdirSync(uploadsPath);
          }

          const readmePath = join(uploadsPath, basename(name));
          await writeFile(readmePath, contents);

          readmeFiles.push({
            mime: 'text/markdown',
            filename: name,
            path: readmePath,
          });
        }
        await createAppReadmes(record.id, readmeFiles, transaction);

        const organizations = theme?.filter((filename) => filename.startsWith('@')) ?? [];
        for (const organization of organizations) {
          const organizationFolder = theme?.folder(organization.name);
          const blocks =
            organizationFolder?.filter((filename) => !organizationFolder!.file(filename)!.dir) ??
            [];
          for (const block of blocks) {
            const [, blockName] = block.name.split('/');
            const orgName = organizationFolder!.name.slice(1);
            const blockVersion = await BlockVersion.findOne({
              where: { name: blockName, organizationId: orgName },
            });
            assertKoaCondition(blockVersion != null, ctx, 404, 'Block not found');
            const style = validateStyle(await block.async('text'));
            record.AppBlockStyles = [
              await AppBlockStyle.create(
                {
                  style,
                  appId: record.id,
                  block: `${orgName}/${blockName}`,
                },
                { transaction },
              ),
            ];
          }
        }
      });
      rec = record!;
    } catch (error: unknown) {
      if (error instanceof AppsembleError) {
        ctx.status = 204;
        return;
      }
      // @ts-expect-error 2769 No overload matches this call (strictNullChecks)
      ctx.throw(error);
    }
    ctx.body = rec.toJSON();
    ctx.status = 201;
  } catch (error) {
    handleAppValidationError(ctx, error as Error, result);
  }
}
