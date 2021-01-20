import { randomBytes } from 'crypto';

import { logger } from '@appsemble/node-utils';
import { BlockManifest } from '@appsemble/types';
import {
  AppsembleValidationError,
  BlockMap,
  blockNamePattern,
  normalize,
  Permission,
  StyleValidationError,
  validateAppDefinition,
  validateStyle,
} from '@appsemble/utils';
import { badRequest, conflict, notFound } from '@hapi/boom';
import { fromBuffer } from 'file-type';
import jsYaml from 'js-yaml';
import { File } from 'koas-body-parser';
import { isEqual, uniqWith } from 'lodash';
import { col, fn, literal, Op, UniqueConstraintError } from 'sequelize';
import sharp from 'sharp';
import { generateVAPIDKeys } from 'web-push';

import {
  App,
  AppBlockStyle,
  AppRating,
  AppScreenshot,
  BlockVersion,
  Member,
  Organization,
  Resource,
  transactional,
} from '../models';
import { KoaContext } from '../types';
import { checkRole } from '../utils/checkRole';
import { getAppFromRecord } from '../utils/model';
import { readAsset } from '../utils/readAsset';

interface Params {
  appId: number;
  blockId: string;
  organizationId: string;
  screenshotId: number;
}

async function getBlockVersions(blocks: BlockMap): Promise<BlockManifest[]> {
  const blockVersions = await BlockVersion.findAll({
    raw: true,
    where: {
      [Op.or]: uniqWith(
        Object.values(blocks).map(({ type, version }) => {
          const [, OrganizationId, name] = type.match(blockNamePattern) || [
            null,
            'appsemble',
            type,
          ];
          return {
            name,
            OrganizationId,
            version,
          };
        }),
        isEqual,
      ),
    },
  });

  return blockVersions.map((blockVersion) => ({
    ...blockVersion,
    name: `@${blockVersion.OrganizationId}/${blockVersion.name}`,
    files: null,
  }));
}

function handleAppValidationError(error: Error, app: Partial<App>): never {
  if (error instanceof UniqueConstraintError) {
    throw conflict(`Another app with path “@${app.OrganizationId}/${app.path}” already exists`);
  }

  if (error instanceof AppsembleValidationError) {
    throw badRequest('Appsemble definition is invalid.', error.data || error.message);
  }

  if (error instanceof StyleValidationError) {
    throw badRequest('Provided CSS was invalid.');
  }

  if (error.message === 'Expected file ´coreStyle´ to be css') {
    throw badRequest(error.message);
  }

  if (error.message === 'Expected file ´sharedStyle´ to be css') {
    throw badRequest(error.message);
  }

  throw error;
}

export async function createApp(ctx: KoaContext): Promise<void> {
  const {
    request: {
      body: {
        OrganizationId,
        coreStyle,
        definition,
        domain,
        icon,
        private: isPrivate = true,
        screenshots,
        sharedStyle,
        template = false,
        yaml,
      },
    },
  } = ctx;

  let result: Partial<App>;

  try {
    const path = normalize(definition.name);
    const keys = generateVAPIDKeys();

    result = {
      definition,
      OrganizationId,
      coreStyle: validateStyle(coreStyle?.contents),
      sharedStyle: validateStyle(sharedStyle?.contents),
      domain: domain || null,
      private: Boolean(isPrivate),
      template: Boolean(template),
      yaml: yaml || jsYaml.safeDump(definition),
      vapidPublicKey: keys.publicKey,
      vapidPrivateKey: keys.privateKey,
    };

    if (icon) {
      result.icon = icon.contents;
    }

    if (yaml) {
      try {
        // The YAML should be valid YAML.
        jsYaml.safeLoad(yaml);
      } catch {
        throw badRequest('Provided YAML was invalid.');
      }
    }

    await checkRole(ctx, OrganizationId, Permission.CreateApps);
    await validateAppDefinition(definition, getBlockVersions);

    for (let i = 1; i < 11; i += 1) {
      const p = i === 1 ? path : `${path}-${i}`;
      const count = await App.count({ where: { path: p } });
      if (count === 0) {
        result.path = p;
        break;
      }
    }

    if (!result.path) {
      // Fallback if a suitable ID could not be found after trying for a while
      result.path = `${path}-${randomBytes(5).toString('hex')}`;
    }

    let record: App;
    await transactional(async (transaction) => {
      record = await App.create(result, { transaction });
      logger.verbose(`Storing ${screenshots?.length ?? 0} screenshots`);
      record.AppScreenshots = screenshots?.length
        ? await AppScreenshot.bulkCreate(
            screenshots.map((screenshot: File) => ({
              screenshot: screenshot.contents,
              AppId: record.id,
            })),
            // These queries provide huge logs.
            { transaction, logging: false },
          )
        : [];
    });

    ctx.body = getAppFromRecord(record);
    ctx.status = 201;
  } catch (error: unknown) {
    handleAppValidationError(error as Error, result);
  }
}

export async function getAppById(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: {
      include: [
        [fn('AVG', col('AppRatings.rating')), 'RatingAverage'],
        [fn('COUNT', col('AppRatings.AppId')), 'RatingCount'],
        [fn('COUNT', col('Resources.id')), 'ResourceCount'],
      ],
      exclude: ['icon', 'coreStyle', 'sharedStyle'],
    },
    include: [
      { model: AppRating, attributes: [] },
      { model: Resource, attributes: [], where: { clonable: true }, required: false },
    ],
    group: ['App.id'],
  });

  if (!app) {
    throw notFound('App not found');
  }

  app.AppScreenshots = await AppScreenshot.findAll({
    attributes: ['id'],
    where: { AppId: app.id },
  });

  ctx.body = getAppFromRecord(app);
}

export async function queryApps(ctx: KoaContext): Promise<void> {
  const apps = await App.findAll({
    attributes: {
      include: [
        [fn('AVG', col('AppRatings.rating')), 'RatingAverage'],
        [fn('COUNT', col('AppRatings.AppId')), 'RatingCount'],
      ],
      exclude: ['yaml', 'icon', 'coreStyle', 'sharedStyle'],
    },
    where: { private: false },
    include: [{ model: AppRating, attributes: [] }],
    group: ['App.id'],
    order: [literal('"RatingAverage" DESC NULLS LAST'), ['id', 'ASC']],
  });
  ctx.body = apps.map((app) => getAppFromRecord(app, ['yaml']));
}

export async function queryMyApps(ctx: KoaContext): Promise<void> {
  const { user } = ctx;

  const memberships = await Member.findAll({
    attributes: ['OrganizationId'],
    raw: true,
    where: { UserId: user.id },
  });
  const apps = await App.findAll({
    attributes: {
      include: [
        [fn('AVG', col('AppRatings.rating')), 'RatingAverage'],
        [fn('COUNT', col('AppRatings.AppId')), 'RatingCount'],
      ],
      exclude: ['yaml', 'icon', 'coreStyle', 'sharedStyle'],
    },
    include: [{ model: AppRating, attributes: [] }],
    group: ['App.id'],
    order: [literal('"RatingAverage" DESC NULLS LAST'), ['id', 'ASC']],
    where: { OrganizationId: { [Op.in]: memberships.map((m) => m.OrganizationId) } },
  });
  ctx.body = apps.map((app) => getAppFromRecord(app, ['yaml']));
}

export async function updateApp(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId },
    request: {
      body: { coreStyle, definition, domain, path, screenshots, sharedStyle, yaml },
    },
  } = ctx;

  let result: Partial<App>;

  try {
    result = {
      definition,
      coreStyle: validateStyle(coreStyle?.contents),
      sharedStyle: validateStyle(sharedStyle?.contents),
      domain,
      path: path || normalize(definition.name),
      yaml: yaml?.toString('utf8'),
    };

    if (yaml) {
      let appFromYaml;
      try {
        // The YAML should be valid YAML.
        appFromYaml = jsYaml.safeLoad(yaml.contents);
      } catch {
        throw badRequest('Provided YAML was invalid.');
      }

      // The YAML should be the same when converted to JSON.
      if (!isEqual(appFromYaml, definition)) {
        throw badRequest('Provided YAML was not equal to definition when converted.');
      }
    } else {
      result.yaml = jsYaml.safeDump(definition);
    }

    await validateAppDefinition(definition, getBlockVersions);

    const dbApp = await App.findByPk(appId);

    if (!dbApp) {
      throw notFound('App not found');
    }

    await checkRole(ctx, dbApp.OrganizationId, [Permission.EditApps, Permission.EditAppSettings]);

    await transactional(async (transaction) => {
      await dbApp.update(result, { where: { id: appId }, transaction });
      await AppScreenshot.destroy({ where: { AppId: appId }, transaction });
      if (screenshots?.length) {
        logger.verbose(`Saving ${screenshots.length} screenshots`);
        dbApp.AppScreenshots = await AppScreenshot.bulkCreate(
          screenshots.map((screenshot: File) => ({
            screenshot: screenshot.contents,
            AppId: dbApp.id,
          })),
          // These queries provide huge logs.
          { transaction, logging: false },
        );
      }
    });

    ctx.body = getAppFromRecord(dbApp);
  } catch (error: unknown) {
    handleAppValidationError(error as Error, result);
  }
}

export async function patchApp(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId },
    request: {
      body: {
        coreStyle,
        definition,
        domain,
        icon,
        path,
        private: isPrivate,
        screenshots,
        sharedStyle,
        template,
        yaml,
      },
    },
  } = ctx;

  let result: Partial<App>;

  try {
    result = {};

    if (definition) {
      result.definition = definition;
      await validateAppDefinition(definition, getBlockVersions);
    }

    if (path) {
      result.path = path;
    }

    if (isPrivate !== undefined) {
      result.private = isPrivate;
    }

    if (template !== undefined) {
      result.template = template;
    }

    if (domain !== undefined) {
      result.domain = domain;
    }

    if (coreStyle) {
      result.coreStyle = validateStyle(coreStyle.contents);
    }

    if (sharedStyle) {
      result.sharedStyle = validateStyle(sharedStyle.contents);
    }

    if (icon) {
      result.icon = icon.contents;
    }

    if (yaml) {
      let appFromYaml;
      try {
        // The YAML should be valid YAML.
        appFromYaml = jsYaml.safeLoad(yaml.contents || yaml);
      } catch {
        throw badRequest('Provided YAML was invalid.');
      }

      // The YAML should be the same when converted to JSON.
      if (!isEqual(appFromYaml, definition)) {
        throw badRequest('Provided YAML was not equal to definition when converted.');
      }

      result.yaml = yaml.contents?.toString('utf8') || yaml;
    } else if (definition) {
      result.yaml = jsYaml.safeDump(definition);
    }

    const dbApp = await App.findOne({
      where: { id: appId },
      include: [{ model: AppScreenshot, attributes: ['id'] }],
    });

    if (!dbApp) {
      throw notFound('App not found');
    }

    const checkPermissions: Permission[] = [];

    if (
      domain !== undefined ||
      path !== undefined ||
      isPrivate !== undefined ||
      template !== undefined
    ) {
      checkPermissions.push(Permission.EditAppSettings);
    }

    if (yaml || definition) {
      checkPermissions.push(Permission.EditApps);
    }

    await checkRole(ctx, dbApp.OrganizationId, checkPermissions);

    await transactional(async (transaction) => {
      await dbApp.update(result, { where: { id: appId }, transaction });
      if (screenshots?.length) {
        await AppScreenshot.destroy({ where: { AppId: appId }, transaction });
        logger.verbose(`Saving ${screenshots.length} screenshots`);
        dbApp.AppScreenshots = await AppScreenshot.bulkCreate(
          screenshots.map((screenshot: File) => ({
            screenshot: screenshot.contents,
            AppId: dbApp.id,
          })),
          // These queries provide huge logs.
          { transaction, logging: false },
        );
      }
    });

    ctx.body = getAppFromRecord(dbApp);
  } catch (error: unknown) {
    handleAppValidationError(error as Error, result);
  }
}

export async function deleteApp(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId },
  } = ctx;

  const app = await App.findByPk(appId);

  if (!app) {
    throw notFound('App not found');
  }

  await checkRole(ctx, app.OrganizationId, Permission.DeleteApps);

  await app.update({ path: null });
  await app.destroy();
}

export async function getAppIcon(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId },
  } = ctx;
  const app = await App.findByPk(appId, {
    attributes: ['icon'],
    include: [{ model: Organization, attributes: ['icon'] }],
  });

  if (!app) {
    throw notFound('App not found');
  }

  const icon = app.icon || app.Organization.icon || (await readAsset('appsemble.svg'));
  const metadata = await sharp(icon).metadata();

  ctx.body = icon;
  // Type svg resolves to text/xml instead of image/svg+xml.
  ctx.type = metadata.format === 'svg' ? 'image/svg+xml' : metadata.format;
}

export async function getAppScreenshot(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId, screenshotId },
  } = ctx;
  const app = await App.findByPk(appId, {
    attributes: [],
    include: [
      {
        attributes: ['screenshot'],
        model: AppScreenshot,
        required: false,
        where: { id: screenshotId },
      },
    ],
  });

  if (!app) {
    throw notFound('App not found');
  }

  if (!app.AppScreenshots?.length) {
    throw notFound('Screenshot not found');
  }

  const [{ screenshot }] = app.AppScreenshots;

  const { mime } = await fromBuffer(screenshot);
  ctx.body = screenshot;
  ctx.type = mime;
}

export async function createAppScreenshot(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId },
    request: {
      body: { screenshots },
    },
  } = ctx;
  const app = await App.findByPk(appId, {
    attributes: ['id', 'OrganizationId'],
  });

  if (!app) {
    throw notFound('App not found');
  }

  await checkRole(ctx, app.OrganizationId, Permission.EditAppSettings);

  await transactional(async (transaction) => {
    logger.verbose(`Saving ${screenshots.length} screenshots`);
    const result = await AppScreenshot.bulkCreate(
      screenshots.map((screenshot: File) => ({
        screenshot: screenshot.contents,
        AppId: app.id,
      })),
      // These queries provide huge logs.
      { transaction, logging: false },
    );

    ctx.body = result.map((screenshot) => screenshot.id);
  });
}

export async function deleteAppScreenshot(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId, screenshotId },
  } = ctx;
  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
    include: [{ model: AppScreenshot, where: { id: screenshotId }, required: false }],
  });

  if (!app) {
    throw notFound('App not found');
  }

  await checkRole(ctx, app.OrganizationId, Permission.EditAppSettings);

  if (!app.AppScreenshots.length) {
    throw notFound('Screenshot not found');
  }

  await app.AppScreenshots[0].destroy();
}

export async function getAppCoreStyle(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId },
  } = ctx;

  const app = await App.findByPk(appId, { raw: true });

  if (!app) {
    throw notFound('App not found');
  }

  ctx.body = app.coreStyle || '';
  ctx.type = 'css';
  ctx.status = 200;
}

export async function getAppSharedStyle(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId },
  } = ctx;

  const app = await App.findByPk(appId, { raw: true });

  if (!app) {
    throw notFound('App not found');
  }

  ctx.body = app.sharedStyle || '';
  ctx.type = 'css';
  ctx.status = 200;
}

export async function getAppBlockStyle(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId, blockId, organizationId },
  } = ctx;

  const blockStyle = await AppBlockStyle.findOne({
    where: {
      AppId: appId,
      block: `@${organizationId}/${blockId}`,
    },
  });

  ctx.body = blockStyle?.style ? blockStyle.style : '';
  ctx.type = 'css';
  ctx.status = 200;
}

export async function setAppBlockStyle(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId, blockId, organizationId },
    request: {
      body: { style },
    },
  } = ctx;
  const css = String(style.contents).trim();

  try {
    validateStyle(css);

    const app = await App.findByPk(appId);
    if (!app) {
      throw notFound('App not found.');
    }

    const block = await BlockVersion.findOne({
      where: { name: blockId, OrganizationId: organizationId },
    });
    if (!block) {
      throw notFound('Block not found.');
    }

    await checkRole(ctx, app.OrganizationId, Permission.EditApps);

    await (css.length
      ? AppBlockStyle.upsert({
          style: css,
          AppId: app.id,
          block: `@${block.OrganizationId}/${block.name}`,
        })
      : AppBlockStyle.destroy({
          where: { AppId: app.id, block: `@${block.OrganizationId}/${block.name}` },
        }));

    ctx.status = 204;
  } catch (error: unknown) {
    if (error instanceof StyleValidationError) {
      throw badRequest('Provided CSS was invalid.');
    }

    throw error;
  }
}
