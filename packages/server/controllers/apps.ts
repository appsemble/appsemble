import { randomBytes } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';

import { AppsembleError, logger, serveIcon } from '@appsemble/node-utils';
import { App as AppType, BlockManifest } from '@appsemble/types';
import {
  IdentifiableBlock,
  normalize,
  parseBlockName,
  Permission,
  StyleValidationError,
  validateAppDefinition,
  validateStyle,
} from '@appsemble/utils';
import { badRequest, conflict, notFound } from '@hapi/boom';
import { parseISO } from 'date-fns';
import { Context } from 'koa';
import { File } from 'koas-body-parser';
import { lookup } from 'mime-types';
import { col, fn, literal, Op, UniqueConstraintError } from 'sequelize';
import sharp from 'sharp';
import webpush from 'web-push';
import { parse } from 'yaml';

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
} from '../models/index.js';
import { applyAppMessages, compareApps, parseLanguage } from '../utils/app.js';
import { argv } from '../utils/argv.js';
import { blockVersionToJson, syncBlock } from '../utils/block.js';
import { checkAppLock } from '../utils/checkAppLock.js';
import { checkRole } from '../utils/checkRole.js';
import { encrypt } from '../utils/crypto.js';
import { handleValidatorResult } from '../../node-utils/jsonschema.js';

async function getBlockVersions(blocks: IdentifiableBlock[]): Promise<BlockManifest[]> {
  const uniqueBlocks = blocks.map(({ type, version }) => {
    const [OrganizationId, name] = parseBlockName(type);
    return {
      name,
      OrganizationId,
      version,
    };
  });
  const blockVersions = await BlockVersion.findAll({
    attributes: { exclude: ['id'] },
    where: { [Op.or]: uniqueBlocks },
  });
  const result: BlockManifest[] = blockVersions.map(blockVersionToJson);

  if (argv.remote) {
    const knownIdentifiers = new Set(
      blockVersions.map((block) => `@${block.OrganizationId}/${block.name}@${block.version}`),
    );
    const unknownBlocks = uniqueBlocks.filter(
      (block) => !knownIdentifiers.has(`@${block.OrganizationId}/${block.name}@${block.version}`),
    );
    const syncedBlocks = await Promise.all(unknownBlocks.map(syncBlock));
    result.push(...syncedBlocks.filter(Boolean));
  }

  return result;
}

function handleAppValidationError(error: Error, app: Partial<App>): never {
  if (error instanceof UniqueConstraintError) {
    throw conflict(`Another app with path “@${app.OrganizationId}/${app.path}” already exists`);
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

export async function createApp(ctx: Context): Promise<void> {
  const {
    openApi,
    request: {
      body: {
        OrganizationId,
        coreStyle,
        domain,
        googleAnalyticsID,
        icon,
        iconBackground,
        longDescription,
        maskableIcon,
        screenshots,
        sentryDsn,
        sentryEnvironment,
        sharedStyle,
        showAppDefinition = true,
        template = false,
        visibility,
        yaml,
      },
      query: { dryRun },
    },
  } = ctx;

  let result: Partial<App>;
  await checkRole(ctx, OrganizationId, Permission.CreateApps);

  try {
    const definition = parse(yaml, { maxAliasCount: 10_000 });

    handleValidatorResult(
      openApi.validate(definition, openApi.document.components.schemas.AppDefinition, {
        throw: false,
      }),
      'App validation failed',
    );
    handleValidatorResult(
      await validateAppDefinition(definition, getBlockVersions),
      'App validation failed',
    );

    const path = normalize(definition.name);
    const keys = webpush.generateVAPIDKeys();

    result = {
      definition,
      OrganizationId,
      coreStyle: validateStyle(coreStyle),
      googleAnalyticsID,
      longDescription,
      iconBackground: iconBackground || '#ffffff',
      sharedStyle: validateStyle(sharedStyle),
      domain: domain || null,
      showAppDefinition,
      visibility,
      template: Boolean(template),
      sentryDsn,
      sentryEnvironment,
      showAppsembleLogin: false,
      showAppsembleOAuth2Login: true,
      vapidPublicKey: keys.publicKey,
      vapidPrivateKey: keys.privateKey,
    };

    if (icon) {
      result.icon = icon.contents;
    }

    if (maskableIcon) {
      result.maskableIcon = maskableIcon.contents;
    }

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
    try {
      await transactional(async (transaction) => {
        record = await App.create(result, { transaction });
        record.AppSnapshots = [
          await AppSnapshot.create({ AppId: record.id, yaml }, { transaction }),
        ];
        logger.verbose(`Storing ${screenshots?.length ?? 0} screenshots`);
        record.AppScreenshots = screenshots?.length
          ? await AppScreenshot.bulkCreate(
              await Promise.all(
                screenshots.map(async ({ contents }: File) => {
                  const img = sharp(contents);

                  const { format, height, width } = await img.metadata();
                  const mime = lookup(format);

                  if (!mime) {
                    throw badRequest(`Unknown screenshot mime type: ${mime}`);
                  }

                  return {
                    screenshot: contents,
                    AppId: record.id,
                    mime,
                    width,
                    height,
                  };
                }),
              ),
              // These queries provide huge logs.
              { transaction, logging: false },
            )
          : [];

        if (dryRun === 'true') {
          // Manually calling `await transaction.rollback()` causes an error
          // when the transaction goes out of scope.
          throw new AppsembleError('Dry run');
        }
      });
    } catch (error: unknown) {
      // AppsembleError is only thrown when dryRun is set, meaning it’s only used to test
      if (error instanceof AppsembleError) {
        ctx.status = 204;
        return;
      }

      throw error;
    }

    record.Organization = await Organization.findByPk(record.OrganizationId, {
      attributes: {
        include: ['id', 'name', 'updated', [literal('"Organization".icon IS NOT NULL'), 'hasIcon']],
      },
    });
    ctx.body = record.toJSON();
    ctx.status = 201;
  } catch (error: unknown) {
    handleAppValidationError(error as Error, result);
  }
}

export async function getAppById(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;
  const { baseLanguage, language, query: languageQuery } = parseLanguage(ctx.query?.language);

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

  const propertyFilters: (keyof AppType)[] = [];
  if (app.visibility === 'private' || !app.showAppDefinition) {
    try {
      await checkRole(ctx, app.OrganizationId, Permission.ViewApps);
    } catch (error) {
      if (app.visibility === 'private') {
        throw error;
      }
      propertyFilters.push('yaml');
    }
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

  ctx.body = app.toJSON(propertyFilters);
}

export async function queryApps(ctx: Context): Promise<void> {
  const { baseLanguage, language, query: languageQuery } = parseLanguage(ctx.query?.language);

  const apps = await App.findAll({
    attributes: {
      exclude: ['icon', 'coreStyle', 'sharedStyle'],
      include: [
        [literal('"App".icon IS NOT NULL'), 'hasIcon'],
        [literal('"maskableIcon" IS NOT NULL'), 'hasMaskableIcon'],
      ],
    },
    where: { visibility: 'public' },
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
    .map((app) => app.toJSON(['yaml']));
}

export async function queryMyApps(ctx: Context): Promise<void> {
  const { user } = ctx;
  const { baseLanguage, language, query: languageQuery } = parseLanguage(ctx.query?.language);

  const memberships = await Member.findAll({
    attributes: ['OrganizationId'],
    raw: true,
    where: { UserId: user.id },
  });

  const apps = await App.findAll({
    attributes: {
      exclude: ['icon', 'coreStyle', 'sharedStyle', 'yaml'],
      include: [
        [literal('"App".icon IS NOT NULL'), 'hasIcon'],
        [literal('"maskableIcon" IS NOT NULL'), 'hasMaskableIcon'],
      ],
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
    .map((app) => app.toJSON(['yaml']));
}

export async function patchApp(ctx: Context): Promise<void> {
  const {
    openApi,
    pathParams: { appId },
    request: {
      body: {
        coreStyle,
        domain,
        emailHost,
        emailName,
        emailPassword,
        emailPort,
        emailSecure,
        emailUser,
        googleAnalyticsID,
        icon,
        iconBackground,
        longDescription,
        maskableIcon,
        path,
        screenshots,
        sentryDsn,
        sentryEnvironment,
        sharedStyle,
        showAppDefinition,
        showAppsembleLogin,
        showAppsembleOAuth2Login,
        template,
        visibility,
        yaml,
      },
    },
    user,
  } = ctx;

  let result: Partial<App>;

  const dbApp = await App.findOne({
    where: { id: appId },
    attributes: {
      exclude: ['icon', 'coreStyle', 'sharedStyle', 'yaml'],
      include: [
        [literal('"App".icon IS NOT NULL'), 'hasIcon'],
        [literal('"maskableIcon" IS NOT NULL'), 'hasMaskableIcon'],
      ],
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
      { model: AppScreenshot, attributes: ['id'] },
    ],
  });

  if (!dbApp) {
    throw notFound('App not found');
  }

  checkAppLock(ctx, dbApp);

  const checkPermissions: Permission[] = [];

  try {
    result = {};

    if (yaml) {
      checkPermissions.push(Permission.EditApps);
      const definition = parse(yaml, { maxAliasCount: 10_000 });
      handleValidatorResult(
        openApi.validate(definition, openApi.document.components.schemas.AppDefinition, {
          throw: false,
        }),
        'App validation failed',
      );
      handleValidatorResult(
        await validateAppDefinition(definition, getBlockVersions),
        'App validation failed',
      );
      result.definition = definition;
    }

    if (path) {
      result.path = path;
    }

    if (visibility !== undefined) {
      result.visibility = visibility;
    }

    if (template !== undefined) {
      result.template = template;
    }

    if (domain !== undefined) {
      result.domain = domain;
    }

    if (emailName !== undefined) {
      result.emailName = emailName;
    }

    if (emailHost !== undefined) {
      result.emailHost = emailHost;
    }

    if (emailPassword !== undefined) {
      result.emailPassword = (emailPassword as string).length
        ? encrypt(emailPassword, argv.aesSecret)
        : null;
    }

    if (emailUser !== undefined) {
      result.emailUser = emailUser;
    }

    if (emailPort !== undefined) {
      const port = Number(emailPort);
      result.emailPort = Number.isFinite(port) ? port : 587;
    }

    if (emailSecure !== undefined) {
      result.emailSecure = emailSecure;
    }

    if (googleAnalyticsID !== undefined) {
      result.googleAnalyticsID = googleAnalyticsID;
    }

    if (longDescription !== undefined) {
      result.longDescription = longDescription;
    }

    if (showAppDefinition !== undefined) {
      result.showAppDefinition = showAppDefinition;
    }

    if (sentryDsn !== undefined) {
      result.sentryDsn = sentryDsn;
    }

    if (sentryEnvironment !== undefined) {
      result.sentryEnvironment = sentryEnvironment;
    }

    if (showAppsembleLogin !== undefined) {
      result.showAppsembleLogin = showAppsembleLogin;
    }

    if (showAppsembleOAuth2Login !== undefined) {
      result.showAppsembleOAuth2Login = showAppsembleOAuth2Login;
    }

    if (coreStyle) {
      result.coreStyle = validateStyle(coreStyle);
    }

    if (sharedStyle) {
      result.sharedStyle = validateStyle(sharedStyle);
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

    if (
      domain !== undefined ||
      path !== undefined ||
      visibility !== undefined ||
      template !== undefined ||
      icon !== undefined ||
      maskableIcon !== undefined ||
      iconBackground !== undefined
    ) {
      checkPermissions.push(Permission.EditAppSettings);
    }

    await checkRole(ctx, dbApp.OrganizationId, checkPermissions);

    await transactional(async (transaction) => {
      await dbApp.update(result, { where: { id: appId }, transaction });
      if (yaml) {
        const snapshot = await AppSnapshot.create(
          { AppId: dbApp.id, UserId: user.id, yaml },
          { transaction },
        );
        dbApp.AppSnapshots = [snapshot];
      }
      if (screenshots?.length) {
        await AppScreenshot.destroy({ where: { AppId: appId }, transaction });
        logger.verbose(`Saving ${screenshots.length} screenshots`);
        dbApp.AppScreenshots = await AppScreenshot.bulkCreate(
          await Promise.all(
            screenshots.map(async ({ contents }: File) => {
              const img = sharp(contents);

              const { format, height, width } = await img.metadata();
              const mime = lookup(format);

              if (!mime) {
                throw badRequest(`Unknown screenshot mime type: ${mime}`);
              }

              return {
                screenshot: contents,
                AppId: dbApp.id,
                mime,
                width,
                height,
              };
            }),
          ),
          // These queries provide huge logs.
          { transaction, logging: false },
        );
      }
    });

    ctx.body = dbApp.toJSON();
  } catch (error: unknown) {
    handleAppValidationError(error as Error, result);
  }
}

export async function setAppLock(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: { locked },
    },
  } = ctx;

  const app = await App.findOne({
    where: { id: appId },
    attributes: ['id', 'OrganizationId', 'locked'],
    include: [{ model: AppScreenshot, attributes: ['id'] }],
  });

  if (!app) {
    throw notFound('App not found');
  }

  await checkRole(ctx, app.OrganizationId, Permission.EditAppSettings);
  await app.update({ locked });
}

export async function deleteApp(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, { attributes: ['id', 'OrganizationId'] });

  if (!app) {
    throw notFound('App not found');
  }

  await checkRole(ctx, app.OrganizationId, Permission.DeleteApps);

  await app.update({ path: null });
  await app.destroy();
}

export async function getAppEmailSettings(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: [
      'emailName',
      'emailHost',
      'emailUser',
      'emailPassword',
      'emailPort',
      'emailSecure',
      'id',
      'OrganizationId',
    ],
  });

  if (!app) {
    throw notFound('App not found');
  }

  await checkRole(ctx, app.OrganizationId, Permission.EditAppSettings);

  const { emailHost, emailName, emailPassword, emailPort, emailSecure, emailUser } = app;

  ctx.body = {
    emailName,
    emailHost,
    emailUser,
    emailPort,
    emailSecure,
    emailPassword: Boolean(emailPassword?.length),
  };
}

export async function getAppSnapshots(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: [],
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

export async function getAppSnapshot(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, snapshotId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: [],
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

export async function getAppIcon(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    query: { maskable = false, raw = false, size = 128, updated },
  } = ctx;
  const app = await App.findByPk(appId, {
    attributes: [
      'icon',
      'updated',
      maskable && 'maskableIcon',
      maskable && 'iconBackground',
    ].filter(Boolean),
    include: [{ model: Organization, attributes: ['icon', 'updated'] }],
  });

  if (!app) {
    throw notFound('App not found');
  }

  const dbUpdated =
    (maskable && app.maskableIcon) || app.icon ? app.updated : app.Organization.updated;

  return serveIcon(ctx, {
    background: maskable ? app.iconBackground || '#ffffff' : undefined,
    cache: isDeepStrictEqual(parseISO(updated as string), dbUpdated),
    fallback: 'mobile-alt-solid.png',
    height: size && Number.parseInt(size as string),
    icon: app.icon || app.Organization.icon,
    maskable: Boolean(maskable),
    maskableIcon: app.maskableIcon,
    raw: Boolean(raw),
    width: size && Number.parseInt(size as string),
  });
}

export async function deleteAppIcon(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
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

export async function deleteAppMaskableIcon(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
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

export async function getAppScreenshot(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, screenshotId },
  } = ctx;
  const app = await App.findByPk(appId, {
    attributes: [],
    include: [
      {
        attributes: ['screenshot', 'mime'],
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

  const [{ mime, screenshot }] = app.AppScreenshots;

  ctx.body = screenshot;
  ctx.type = mime;
}

export async function createAppScreenshot(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
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
      await Promise.all(
        screenshots.map(async ({ contents }: File) => {
          const img = sharp(contents);

          const { format, height, width } = await img.metadata();
          const mime = lookup(format);

          if (!mime) {
            throw badRequest(`Unknown screenshot mime type: ${mime}`);
          }

          return {
            screenshot: contents,
            AppId: app.id,
            mime,
            width,
            height,
          };
        }),
      ),
      // These queries provide huge logs.
      { transaction, logging: false },
    );

    ctx.body = result.map((screenshot) => screenshot.id);
  });
}

export async function deleteAppScreenshot(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, screenshotId },
  } = ctx;
  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
    include: [
      { model: AppScreenshot, attributes: ['id'], where: { id: screenshotId }, required: false },
    ],
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

export async function getAppCoreStyle(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, { attributes: ['coreStyle'], raw: true });

  if (!app) {
    throw notFound('App not found');
  }

  ctx.body = app.coreStyle || '';
  ctx.type = 'css';
  ctx.status = 200;
}

export async function getAppSharedStyle(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, { attributes: ['sharedStyle'], raw: true });

  if (!app) {
    throw notFound('App not found');
  }

  ctx.body = app.sharedStyle || '';
  ctx.type = 'css';
  ctx.status = 200;
}

export async function getAppBlockStyle(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, blockId, organizationId },
  } = ctx;

  const blockStyle = await AppBlockStyle.findOne({
    where: {
      AppId: appId,
      block: `@${organizationId}/${blockId}`,
    },
  });

  ctx.body = blockStyle?.style || '';
  ctx.type = 'css';
  ctx.status = 200;
}

export async function setAppBlockStyle(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, blockId, organizationId },
    request: {
      body: { style },
    },
  } = ctx;
  const css = String(style).trim();

  try {
    const app = await App.findByPk(appId, { attributes: ['locked', 'OrganizationId'] });
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
          AppId: appId,
          block: `@${block.OrganizationId}/${block.name}`,
        })
      : AppBlockStyle.destroy({
          where: { AppId: appId, block: `@${block.OrganizationId}/${block.name}` },
        }));

    ctx.status = 204;
  } catch (error: unknown) {
    if (error instanceof StyleValidationError) {
      throw badRequest('Provided CSS was invalid.');
    }

    throw error;
  }
}
