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
  AppSnapshot,
  BlockVersion,
  Member,
  Organization,
  Resource,
  transactional,
  User,
} from '../models';
import { KoaContext } from '../types';
import { applyAppMessages, compareApps, parseLanguage } from '../utils/app';
import { checkAppLock } from '../utils/checkAppLock';
import { checkRole } from '../utils/checkRole';
import { serveIcon } from '../utils/icon';
import { getAppFromRecord } from '../utils/model';
import { readAsset } from '../utils/readAsset';

interface Params {
  appId: number;
  blockId: string;
  organizationId: string;
  screenshotId: number;
  snapshotId: number;
}

async function getBlockVersions(blocks: BlockMap): Promise<BlockManifest[]> {
  const blockVersions = await BlockVersion.findAll({
    raw: true,
    attributes: { exclude: ['id'] },
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
        longDescription,
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
      longDescription,
      sharedStyle: validateStyle(sharedStyle?.contents),
      domain: domain || null,
      private: Boolean(isPrivate),
      template: Boolean(template),
      showAppsembleLogin: true,
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
      const newYaml = yaml ? yaml.contents?.toString('utf8') || yaml : jsYaml.safeDump(definition);
      record.AppSnapshots = [
        await AppSnapshot.create({ AppId: record.id, yaml: newYaml }, { transaction }),
      ];
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

    record.Organization = await Organization.findByPk(record.OrganizationId, {
      attributes: {
        include: ['id', 'name', 'updated', [literal('"Organization".icon IS NOT NULL'), 'hasIcon']],
      },
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
  const { baseLanguage, language, query: languageQuery } = parseLanguage(ctx);

  const app = await App.findByPk(appId, {
    attributes: {
      include: [
        [literal('"App".icon IS NOT NULL'), 'hasIcon'],
        [literal('"maskableIcon" IS NOT NULL'), 'hasMaskableIcon'],
      ],
      exclude: ['App.icon', 'maskableIcon', 'coreStyle', 'sharedStyle'],
    },
    include: [
      { model: Resource, attributes: ['id'], where: { clonable: true }, required: false },
      { model: AppSnapshot },
      {
        model: Organization,
        attributes: {
          include: [
            'id',
            'name',
            'updated',
            [literal('"Organization".icon IS NOT NULL'), 'hasIcon'],
          ],
        },
      },
      { model: AppScreenshot, attributes: ['id'] },
      ...languageQuery,
    ],
    order: [[{ model: AppSnapshot, as: 'AppSnapshots' }, 'created', 'DESC']],
  });

  if (!app) {
    throw notFound('App not found');
  }

  const rating = await AppRating.findOne({
    attributes: [
      'AppId',
      [fn('AVG', col('rating')), 'RatingAverage'],
      [fn('COUNT', col('AppId')), 'RatingCount'],
    ],
    where: { AppId: app.id },
    group: ['AppId'],
  });

  if (rating) {
    app.RatingCount = Number(rating.get('RatingCount'));
    app.RatingAverage = Number(rating.get('RatingAverage'));
  }

  applyAppMessages(app, language, baseLanguage);

  ctx.body = getAppFromRecord(app);
}

export async function queryApps(ctx: KoaContext): Promise<void> {
  const { baseLanguage, language, query: languageQuery } = parseLanguage(ctx);

  const apps = await App.findAll({
    attributes: {
      exclude: ['icon', 'coreStyle', 'sharedStyle'],
    },
    where: { private: false },
    include: [
      {
        model: Organization,
        attributes: {
          include: [
            'id',
            'name',
            'updated',
            [literal('"Organization".icon IS NOT NULL'), 'hasIcon'],
          ],
        },
      },
      ...languageQuery,
    ],
  });

  const ratings = await AppRating.findAll({
    attributes: [
      'AppId',
      [fn('AVG', col('rating')), 'RatingAverage'],
      [fn('COUNT', col('AppId')), 'RatingCount'],
    ],
    where: { AppId: apps.map((app) => app.id) },
    group: ['AppId'],
  });

  ctx.body = apps
    .map((app) => {
      const rating = ratings.find((r) => r.AppId === app.id);

      if (rating) {
        Object.assign(app, {
          RatingAverage: Number(rating.get('RatingAverage')),
          RatingCount: Number(rating.get('RatingCount')),
        });
      }

      applyAppMessages(app, language, baseLanguage);

      return app;
    })
    .sort(compareApps)
    .map((app) => getAppFromRecord(app, ['yaml']));
}

export async function queryMyApps(ctx: KoaContext): Promise<void> {
  const { user } = ctx;
  const { baseLanguage, language, query: languageQuery } = parseLanguage(ctx);

  const memberships = await Member.findAll({
    attributes: ['OrganizationId'],
    raw: true,
    where: { UserId: user.id },
  });

  const apps = await App.findAll({
    attributes: {
      exclude: ['icon', 'coreStyle', 'sharedStyle', 'yaml'],
    },
    include: [
      {
        model: Organization,
        attributes: {
          include: [
            'id',
            'name',
            'updated',
            [literal('"Organization".icon IS NOT NULL'), 'hasIcon'],
          ],
        },
      },
      ...languageQuery,
    ],
    where: { OrganizationId: { [Op.in]: memberships.map((m) => m.OrganizationId) } },
  });

  const ratings = await AppRating.findAll({
    attributes: [
      'AppId',
      [fn('AVG', col('rating')), 'RatingAverage'],
      [fn('COUNT', col('AppId')), 'RatingCount'],
    ],
    where: { AppId: apps.map((app) => app.id) },
    group: ['AppId'],
  });

  ctx.body = apps
    .map((app) => {
      const rating = ratings.find((r) => r.AppId === app.id);

      if (rating) {
        Object.assign(app, {
          RatingAverage: Number(rating.get('RatingAverage')),
          RatingCount: Number(rating.get('RatingCount')),
        });
      }

      applyAppMessages(app, language, baseLanguage);

      return app;
    })
    .sort(compareApps)
    .map((app) => getAppFromRecord(app, ['yaml']));
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
        iconBackground,
        longDescription,
        maskableIcon,
        path,
        private: isPrivate,
        screenshots,
        sharedStyle,
        showAppsembleLogin,
        template,
        yaml,
      },
    },
    user,
  } = ctx;

  let result: Partial<App>;

  const dbApp = await App.findOne({
    where: { id: appId },
    include: [
      {
        model: Organization,
        attributes: {
          include: [
            'id',
            'name',
            'updated',
            [literal('"Organization".icon IS NOT NULL'), 'hasIcon'],
          ],
        },
      },
      { model: AppScreenshot, attributes: ['id'] },
    ],
  });

  if (!dbApp) {
    throw notFound('App not found');
  }

  checkAppLock(ctx, dbApp);

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

    if (longDescription !== undefined) {
      result.longDescription = longDescription;
    }

    if (showAppsembleLogin !== undefined) {
      result.showAppsembleLogin = showAppsembleLogin;
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

    if (maskableIcon) {
      result.maskableIcon = maskableIcon.contents;
    }

    if (iconBackground) {
      result.iconBackground = iconBackground;
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
    }

    const checkPermissions: Permission[] = [];

    if (
      domain !== undefined ||
      path !== undefined ||
      isPrivate !== undefined ||
      template !== undefined ||
      icon !== undefined ||
      maskableIcon !== undefined ||
      iconBackground !== undefined
    ) {
      checkPermissions.push(Permission.EditAppSettings);
    }

    if (yaml || definition) {
      checkPermissions.push(Permission.EditApps);
    }

    await checkRole(ctx, dbApp.OrganizationId, checkPermissions);

    await transactional(async (transaction) => {
      await dbApp.update(result, { where: { id: appId }, transaction });
      if (definition) {
        const newYaml = yaml
          ? yaml.contents?.toString('utf8') || yaml
          : jsYaml.safeDump(definition);
        const snapshot = await AppSnapshot.create(
          { AppId: dbApp.id, UserId: user.id, yaml: newYaml },
          { transaction },
        );
        dbApp.AppSnapshots = [snapshot];
      }
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

export async function setAppLock(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId },
    request: {
      body: { locked },
    },
  } = ctx;

  const app = await App.findOne({
    where: { id: appId },
    include: [{ model: AppScreenshot, attributes: ['id'] }],
  });

  if (!app) {
    throw notFound('App not found');
  }

  await checkRole(ctx, app.OrganizationId, Permission.EditAppSettings);
  await app.update({ locked });
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

export async function getAppSnapshots(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId },
  } = ctx;

  const app = await App.findByPk(appId, {
    include: {
      model: AppSnapshot,
      attributes: { exclude: ['yaml'] },
      include: [{ model: User, required: false }],
    },
  });

  if (!app) {
    throw notFound('App not found');
  }

  ctx.body = app.AppSnapshots.sort((a, b) => b.id - a.id).map((snapshot) => ({
    id: snapshot.id,
    $created: snapshot.created,
    $author: {
      id: snapshot?.User?.id,
      name: snapshot?.User?.name,
    },
  }));
}

export async function getAppSnapshot(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId, snapshotId },
  } = ctx;

  const app = await App.findByPk(appId, {
    include: {
      model: AppSnapshot,
      required: false,
      include: [{ model: User, required: false }],
      where: { id: snapshotId },
    },
  });

  if (!app) {
    throw notFound('App not found');
  }

  if (!app.AppSnapshots.length) {
    throw notFound('Snapshot not found');
  }

  const [snapshot] = app.AppSnapshots;
  ctx.body = {
    id: snapshot.id,
    $created: snapshot.created,
    $author: {
      id: snapshot?.User?.id,
      name: snapshot?.User?.name,
    },
    yaml: snapshot.yaml,
  };
}

export async function getAppIcon(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId },
    query: { maskable, raw = false, size = 128 },
  } = ctx;
  const app = await App.findByPk(appId, {
    attributes: ['icon', maskable && 'maskableIcon', maskable && 'iconBackground'].filter(Boolean),
    include: [{ model: Organization, attributes: ['icon'] }],
  });

  if (!raw) {
    return serveIcon(ctx, app, {
      maskable: Boolean(maskable),
      size: size && Number.parseInt(size as string),
    });
  }

  if (!app) {
    throw notFound('App not found');
  }

  const icon =
    (maskable && app.maskableIcon) ||
    app.icon ||
    app.Organization.icon ||
    (await readAsset('appsemble.png'));

  const { format } = await sharp(icon).metadata();
  ctx.body = icon;
  ctx.type = format;
}

export async function deleteAppIcon(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId },
  } = ctx;
  const app = await App.findByPk(appId, {
    attributes: ['id', 'icon', 'OrganizationId'],
  });

  if (!app) {
    throw notFound('App not found');
  }

  if (!app.icon) {
    throw notFound('App has no icon');
  }

  await checkRole(ctx, app.OrganizationId, Permission.EditAppSettings);
  await app.update({ icon: null });
}

export async function deleteAppMaskableIcon(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId },
  } = ctx;
  const app = await App.findByPk(appId, {
    attributes: ['id', 'maskableIcon', 'OrganizationId'],
  });

  if (!app) {
    throw notFound('App not found');
  }

  if (!app.maskableIcon) {
    throw notFound('App has no maskable icon');
  }

  await checkRole(ctx, app.OrganizationId, Permission.EditAppSettings);
  await app.update({ maskableIcon: null });
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

  checkAppLock(ctx, app);
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

  checkAppLock(ctx, app);
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
    const app = await App.findByPk(appId);
    if (!app) {
      throw notFound('App not found.');
    }

    checkAppLock(ctx, app);
    validateStyle(css);

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
