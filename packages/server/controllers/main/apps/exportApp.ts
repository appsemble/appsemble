import { assertKoaError } from '@appsemble/node-utils';
import { Permission } from '@appsemble/utils';
import JSZip from 'jszip';
import { type Context } from 'koa';
import { stringify } from 'yaml';

import {
  App,
  AppBlockStyle,
  AppMessages,
  AppReadme,
  AppScreenshot,
  AppSnapshot,
  Asset,
  Resource,
} from '../../../models/index.js';
import { checkRole } from '../../../utils/checkRole.js';

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
      { model: AppBlockStyle, required: false },
      { model: AppMessages, required: false },
      { model: AppSnapshot, as: 'AppSnapshots', order: [['created', 'DESC']], limit: 1 },
      { model: AppScreenshot, as: 'AppScreenshots' },
      { model: AppReadme, as: 'AppReadmes' },
    ],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  if (app.visibility === 'private' || !app.showAppDefinition) {
    await checkRole(ctx, app.OrganizationId, Permission.ViewApps);
  }

  const zip = new JSZip();
  const definition = app.AppSnapshots?.[0]?.yaml || stringify(app.definition);
  zip.file('app-definition.yaml', definition);

  const theme = zip.folder('theme');
  theme.file('core/index.css', app.coreStyle);
  theme.file('shared/index.css', app.sharedStyle);

  if (app.AppMessages !== undefined) {
    const i18 = zip.folder('i18n');
    for (const message of app.AppMessages) {
      i18.file(`${message.language}.json`, JSON.stringify(message.messages));
    }
  }

  if (app.AppBlockStyles !== undefined) {
    for (const block of app.AppBlockStyles) {
      const [orgName, blockName] = block.block.split('/');
      theme.file(`${orgName}/${blockName}/index.css`, block.style);
    }
  }

  if (screenshots && app.AppScreenshots?.length) {
    const screenshotsByLanguage: Record<string, AppScreenshot[]> = {};
    for (const screenshot of app.AppScreenshots) {
      screenshotsByLanguage[screenshot.language] = [
        ...(screenshotsByLanguage[screenshot.language] || []),
        screenshot,
      ];
    }

    const screenshotsFolder = zip.folder('screenshots');
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
    await checkRole(ctx, app.OrganizationId, Permission.EditApps);
    await app.reload({
      include: [Resource],
    });
    const splitResources = new Map<string, Resource[]>();
    for (const resource of app.Resources) {
      if (!splitResources.has(resource.type)) {
        splitResources.set(resource.type, []);
      }
      splitResources.get(resource.type).push(resource);
    }
    for (const [type, resourcesValue] of splitResources.entries()) {
      zip.file(`resources/${type}.json`, JSON.stringify(resourcesValue.map((r) => r.toJSON())));
    }
  }

  if (assets) {
    await checkRole(ctx, app.OrganizationId, Permission.EditApps);
    await app.reload({
      include: [Asset],
    });
    app.Assets.map((asset) => {
      zip.file(`assets/${asset.filename}`, asset.data);
    });
  }

  const content = zip.generateNodeStream();
  ctx.attachment(`${app.definition.name}_${app.id}.zip`);
  ctx.body = content;
  ctx.type = 'application/zip';
  ctx.status = 200;
}
