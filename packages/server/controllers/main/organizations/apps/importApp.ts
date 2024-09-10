import { basename, dirname } from 'node:path';

import {
  AppsembleError,
  assertKoaError,
  getSupportedLanguages,
  handleValidatorResult,
} from '@appsemble/node-utils';
import { normalize, Permissions, validateAppDefinition, validateStyle } from '@appsemble/utils';
import JSZip from 'jszip';
import { type Context } from 'koa';
import { type File } from 'koas-body-parser';
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
  type User,
} from '../../../../models/index.js';
import { getUserAppAccount } from '../../../../options/index.js';
import { options } from '../../../../options/options.js';
import {
  createAppReadmes,
  createAppScreenshots,
  handleAppValidationError,
  setAppPath,
} from '../../../../utils/app.js';
import { getBlockVersions } from '../../../../utils/block.js';
import { checkRole } from '../../../../utils/checkRole.js';
import { processHooks, processReferenceHooks } from '../../../../utils/resource.js';

export async function importApp(ctx: Context): Promise<void> {
  const {
    openApi,
    pathParams: { organizationId },
    request: { body: importFile },
  } = ctx;
  await checkRole(ctx, organizationId, Permissions.EditApps);

  let result: Partial<App>;
  const zip = await JSZip.loadAsync(importFile);
  try {
    const definitionFile = zip.file('app-definition.yaml');
    assertKoaError(!definitionFile, ctx, 400, 'app-definition.yaml file not found in the zip file');

    const yaml = await definitionFile.async('text');
    const theme = zip.folder('theme');
    const definition = parse(yaml, { maxAliasCount: 10_000 });
    handleValidatorResult(
      ctx,
      openApi.validate(definition, openApi.document.components.schemas.AppDefinition, {
        throw: false,
      }),
      'App validation failed',
    );
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
      showAppsembleOAuth2Login: true,
      enableSelfRegistration: true,
      showAppDefinition: true,
      template: false,
      icon,
      iconBackground: '#ffffff',
    };
    await setAppPath(ctx, result, path);
    const coreStyleFile = theme.file('core/index.css');
    if (coreStyleFile) {
      const coreStyle = await coreStyleFile.async('text');
      result.coreStyle = validateStyle(coreStyle);
    }
    const sharedStyleFile = theme.file('shared/index.css');
    if (sharedStyleFile) {
      const sharedStyle = await sharedStyleFile.async('text');
      result.sharedStyle = validateStyle(sharedStyle);
    }

    let record: App;
    try {
      await transactional(async (transaction) => {
        record = await App.create(result, { transaction });
        record.AppSnapshots = [
          await AppSnapshot.create({ AppId: record.id, yaml }, { transaction }),
        ];
        const i18Folder = zip.folder('i18n').filter((filename) => filename.endsWith('json'));
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

        const { user } = ctx;
        const appId = record.id;

        const resourcesFolder = zip
          .folder('resources')
          .filter((filename) => filename.endsWith('json'));

        for (const file of resourcesFolder) {
          const [, resourceJsonName] = file.name.split('/');
          const [resourceType] = resourceJsonName.split('.');
          const action = 'create';
          const resourcesText = await file.async('text');
          const resources = JSON.parse(resourcesText);
          const { verifyResourceActionPermission } = options;

          await verifyResourceActionPermission({
            app: record.toJSON(),
            context: ctx,
            action,
            resourceType,
            options,
            ctx,
          });

          await (user as User)?.reload({ attributes: ['name', 'id'] });
          const appMember = await getUserAppAccount(appId, user.id);
          const createdResources = await Resource.bulkCreate(
            resources.map((data: string) => ({
              AppId: appId,
              type: resourceType,
              data,
              AuthorId: appMember?.id,
            })),
            { logging: false, transaction },
          );
          for (const createdResource of createdResources) {
            createdResource.Author = appMember;
          }

          processReferenceHooks(user as User, record, createdResources[0], action, options, ctx);
          processHooks(user as User, record, createdResources[0], action, options, ctx);
        }

        for (const jsZipObject of zip
          .folder('assets')
          .filter((filename) => !['.DS_Store'].includes(filename))) {
          if (!jsZipObject.dir) {
            const data = await jsZipObject.async('nodebuffer');
            const { name } = jsZipObject;
            await Asset.create(
              {
                AppId: record.id,
                data,
                filename: name,
                mime: lookup(name),
              },
              { transaction },
            );
          }
        }

        const supportedLanguages = await getSupportedLanguages();
        const screenshots: File[] = [];
        for (const jsZipObject of zip
          .folder('screenshots')
          .filter((filename) => !['.DS_Store'].includes(filename))) {
          if (!jsZipObject.dir) {
            const contents = await jsZipObject.async('nodebuffer');

            const { name } = jsZipObject;
            const screenshotDirectoryPath = dirname(name);
            const screenshotDirectoryName = basename(screenshotDirectoryPath);

            const language = supportedLanguages.has(screenshotDirectoryName)
              ? screenshotDirectoryName
              : 'unspecified';

            screenshots.push({
              filename: `${language}-${name}`,
              mime: lookup(name) || '',
              contents,
            });
          }
        }
        await createAppScreenshots(record.id, screenshots, transaction, ctx);

        const readmeFiles: File[] = [];
        for (const jsZipObject of zip.filter(
          (filename) => filename.toLowerCase().startsWith('readme') && filename.endsWith('md'),
        )) {
          const contents = await jsZipObject.async('nodebuffer');
          readmeFiles.push({
            mime: 'text/markdown',
            filename: jsZipObject.name,
            contents,
          });
        }
        await createAppReadmes(record.id, readmeFiles, transaction);

        const organizations = theme.filter((filename) => filename.startsWith('@'));
        for (const organization of organizations) {
          const organizationFolder = theme.folder(organization.name);
          const blocks = organizationFolder.filter(
            (filename) => !organizationFolder.file(filename).dir,
          );
          for (const block of blocks) {
            const [, blockName] = block.name.split('/');
            const orgName = organizationFolder.name.slice(1);
            const blockVersion = await BlockVersion.findOne({
              where: { name: blockName, organizationId: orgName },
            });
            assertKoaError(!blockVersion, ctx, 404, 'Block not found');
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
    } catch (error: unknown) {
      if (error instanceof AppsembleError) {
        ctx.status = 204;
        return;
      }
      ctx.throw(error);
    }
    ctx.body = record.toJSON();
    ctx.status = 201;
  } catch (error) {
    handleAppValidationError(ctx, error as Error, result);
  }
}
