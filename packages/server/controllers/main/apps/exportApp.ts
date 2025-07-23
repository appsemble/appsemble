import { assertKoaCondition, getS3File } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import JSZip from 'jszip';
import { type Context } from 'koa';
import { stringify } from 'yaml';

import {
  App,
  AppMessages,
  AppReadme,
  AppScreenshot,
  AppSnapshot,
  getAppDB,
  type Resource,
} from '../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../utils/authorization.js';

export async function exportApp(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;
  const { assets, readmes, resources, screenshots } = ctx.queryParams;

  const app = await App.findByPk(appId, {
    attributes: [
      'id',
      'definition',
      'coreStyle',
      'icon',
      'OrganizationId',
      'sharedStyle',
      'showAppDefinition',
      'visibility',
    ],
    include: [
      { model: AppMessages, required: false },
      { model: AppSnapshot, as: 'AppSnapshots', order: [['created', 'DESC']], limit: 1 },
      { model: AppScreenshot, as: 'AppScreenshots' },
      { model: AppReadme, as: 'AppReadmes' },
    ],
  });

  assertKoaCondition(app != null, ctx, 404, 'App not found');

  const { AppBlockStyle, Asset, Resource } = await getAppDB(appId);
  const appBlockStyles = await AppBlockStyle.findAll();

  if (app.visibility === 'private' || !app.showAppDefinition) {
    await checkUserOrganizationPermissions({
      context: ctx,
      organizationId: app.OrganizationId,
      requiredPermissions: [OrganizationPermission.QueryApps],
    });
  }

  const zip = new JSZip();
  const definition = app.AppSnapshots?.[0]?.yaml || stringify(app.definition);
  zip.file('app-definition.yaml', definition);
  // The call to zip.folder can't actually return null, but it's not typed correctly
  // https://stackoverflow.com/q/79412936
  const theme = zip.folder('theme')!;
  // @ts-expect-error 2769 No overload matches this call (strictNullChecks)
  theme.file('core/index.css', app.coreStyle);
  // @ts-expect-error 2769 No overload matches this call (strictNullChecks)
  theme.file('shared/index.css', app.sharedStyle);

  if (app.AppMessages !== undefined) {
    const i18 = zip.folder('i18n')!;
    for (const message of app.AppMessages) {
      i18.file(`${message.language}.json`, JSON.stringify(message.messages));
    }
  }

  for (const block of appBlockStyles) {
    const [orgName, blockName] = block.block.split('/');
    // @ts-expect-error 2769 No overload matches this call (strictNullChecks)
    theme.file(`${orgName}/${blockName}/index.css`, block.style);
  }

  if (screenshots && app.AppScreenshots?.length) {
    const screenshotsByLanguage: Record<string, AppScreenshot[]> = {};
    for (const screenshot of app.AppScreenshots) {
      screenshotsByLanguage[screenshot.language] = [
        ...(screenshotsByLanguage[screenshot.language] || []),
        screenshot,
      ];
    }

    const screenshotsFolder = zip.folder('screenshots')!;
    for (const [language, languageScreenshots] of Object.entries(screenshotsByLanguage)) {
      let languageFolder;

      if (language !== 'unspecified') {
        languageFolder = screenshotsFolder.folder(language);
      }

      for (const screenshot of languageScreenshots) {
        const { index, mime } = screenshot;
        const extension = mime.slice(mime.indexOf('/') + 1);

        // This is done to include zeros in the filename and keep the order of screenshots
        let prefixedIndex = String(index);

        if (languageScreenshots.length > 9 && index < 10) {
          prefixedIndex = `0${prefixedIndex}`;
        }

        if (languageScreenshots.length > 99 && index < 100) {
          prefixedIndex = `0${prefixedIndex}`;
        }

        (languageFolder ?? screenshotsFolder).file(
          `${prefixedIndex}.${extension}`,
          screenshot.screenshot,
        );
      }
    }
  }

  if (readmes && app.AppReadmes?.length) {
    for (const readme of app.AppReadmes) {
      zip.file(
        `README${readme.language === 'unspecified' ? '' : `.${readme.language}`}.md`,
        readme.file,
      );
    }
  }

  if (app.icon) {
    zip.file('icon.png', app.icon);
  }

  if (resources) {
    await checkUserOrganizationPermissions({
      context: ctx,
      organizationId: app.OrganizationId,
      requiredPermissions: [OrganizationPermission.QueryAppResources],
    });
    const appResources = await Resource.findAll();
    const splitResources = new Map<string, Resource[]>();
    for (const resource of appResources) {
      if (!splitResources.has(resource.type)) {
        splitResources.set(resource.type, []);
      }
      splitResources.get(resource.type)!.push(resource);
    }
    for (const [type, resourcesValue] of splitResources.entries()) {
      zip.file(
        `resources/${type}.json`,
        JSON.stringify(resourcesValue.map((r) => r.toJSON({ exclude: [] }))),
      );
    }
  }

  if (assets) {
    await checkUserOrganizationPermissions({
      context: ctx,
      organizationId: app.OrganizationId,
      requiredPermissions: [OrganizationPermission.QueryAppAssets],
    });
    const appAssets = await Asset.findAll();
    for (const asset of appAssets) {
      zip.file(`assets/${asset.filename}`, await getS3File(`app-${app.id}`, asset.id));
    }
  }

  const content = await zip.generateNodeStream();
  ctx.attachment(`${app.definition.name}_${app.id}.zip`);
  ctx.body = content;
  ctx.type = 'application/zip';
  ctx.status = 200;
}
