import { randomBytes } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';

import {
  AppsembleError,
  assertKoaError,
  handleValidatorResult,
  logger,
  serveIcon,
  throwKoaError,
} from '@appsemble/node-utils';
import { type App as AppType, type BlockManifest } from '@appsemble/types';
import {
  type IdentifiableBlock,
  normalize,
  parseBlockName,
  Permission,
  StyleValidationError,
  validateAppDefinition,
  validateStyle,
} from '@appsemble/utils';
import { parseISO } from 'date-fns';
import JSZip from 'jszip';
import { type Context } from 'koa';
import { type File } from 'koas-body-parser';
import { lookup } from 'mime-types';
import { col, fn, literal, Op, UniqueConstraintError } from 'sequelize';
import sharp from 'sharp';
import webpush from 'web-push';
import { parse, stringify } from 'yaml';

import {
  App,
  AppBlockStyle,
  AppMessages,
  AppRating,
  AppScreenshot,
  AppSnapshot,
  BlockVersion,
  Organization,
  OrganizationMember,
  Resource,
  transactional,
  User,
} from '../models/index.js';
import { getUserAppAccount } from '../options/getUserAppAccount.js';
import { options } from '../options/options.js';
import { applyAppMessages, compareApps, parseLanguage } from '../utils/app.js';
import { argv } from '../utils/argv.js';
import { blockVersionToJson, syncBlock } from '../utils/block.js';
import { checkAppLock } from '../utils/checkAppLock.js';
import { checkRole } from '../utils/checkRole.js';
import { encrypt } from '../utils/crypto.js';
import { processHooks, processReferenceHooks } from '../utils/resource.js';

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

function handleAppValidationError(ctx: Context, error: Error, app: Partial<App>): never {
  if (error instanceof UniqueConstraintError) {
    throwKoaError(
      ctx,
      409,
      `Another app with path “@${app.OrganizationId}/${app.path}” already exists`,
    );
  }

  if (error instanceof StyleValidationError) {
    throwKoaError(ctx, 400, 'Provided CSS was invalid.');
  }

  if (error.message === 'Expected file ´coreStyle´ to be css') {
    throwKoaError(ctx, 400, error.message);
  }

  if (error.message === 'Expected file ´sharedStyle´ to be css') {
    throwKoaError(ctx, 400, error.message);
  }

  throw error;
}

export async function createApp(ctx: Context): Promise<void> {
  const {
    openApi,
    request: {
      body: {
        OrganizationId,
        controllerCode,
        controllerImplementations,
        coreStyle,
        demoMode,
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
      ctx,
      openApi.validate(definition, openApi.document.components.schemas.AppDefinition, {
        throw: false,
      }),
      'App validation failed',
    );
    handleValidatorResult(
      ctx,
      await validateAppDefinition(
        definition,
        getBlockVersions,
        controllerImplementations ? JSON.parse(controllerImplementations) : undefined,
      ),
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
      enableSelfRegistration: true,
      vapidPublicKey: keys.publicKey,
      vapidPrivateKey: keys.privateKey,
      demoMode: Boolean(demoMode),
      controllerCode,
      controllerImplementations,
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

                  assertKoaError(!mime, ctx, 404, `Unknown screenshot mime type: ${mime}`);

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
    handleAppValidationError(ctx, error as Error, result);
  }
}

export async function getAppById(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;
  const { baseLanguage, language, query: languageQuery } = parseLanguage(ctx, ctx.query?.language);

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

  assertKoaError(!app, ctx, 404, 'App not found');

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

  ctx.status = 200;
  ctx.body = app.toJSON(propertyFilters);
}

export async function queryApps(ctx: Context): Promise<void> {
  const { baseLanguage, language, query: languageQuery } = parseLanguage(ctx, ctx.query?.language);

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
  const { baseLanguage, language, query: languageQuery } = parseLanguage(ctx, ctx.query?.language);

  const memberships = await OrganizationMember.findAll({
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
        controllerCode,
        controllerImplementations,
        coreStyle,
        demoMode,
        domain,
        emailHost,
        emailName,
        emailPassword,
        emailPort,
        emailSecure,
        emailUser,
        enableSelfRegistration,
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

  assertKoaError(!dbApp, ctx, 404, 'App not found');

  checkAppLock(ctx, dbApp);

  const checkPermissions: Permission[] = [];

  try {
    result = {};

    if (yaml) {
      checkPermissions.push(Permission.EditApps);
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
        await validateAppDefinition(
          definition,
          getBlockVersions,
          controllerImplementations ? JSON.parse(controllerImplementations) : undefined,
        ),
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

    if (demoMode !== undefined) {
      result.demoMode = demoMode;
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

    if (enableSelfRegistration !== undefined) {
      result.enableSelfRegistration = enableSelfRegistration;
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

    result.controllerCode = ['', undefined].includes(controllerCode) ? null : controllerCode;
    result.controllerImplementations = ['', undefined].includes(controllerImplementations)
      ? null
      : controllerImplementations;

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

              assertKoaError(!mime, ctx, 404, `Unknown screenshot mime type: ${mime}`);

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
    handleAppValidationError(ctx, error as Error, result);
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

  assertKoaError(!app, ctx, 404, 'App not found');

  await checkRole(ctx, app.OrganizationId, Permission.EditAppSettings);
  await app.update({ locked });
}

export async function deleteApp(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, { attributes: ['id', 'OrganizationId'] });

  assertKoaError(!app, ctx, 404, 'App not found');

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

  assertKoaError(!app, ctx, 404, 'App not found');

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

  assertKoaError(!app, ctx, 404, 'App not found');

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

  assertKoaError(!app, ctx, 404, 'App not found');
  assertKoaError(!app.AppSnapshots.length, ctx, 404, 'Snapshot not found');

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

  assertKoaError(!app, ctx, 404, 'App not found');

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

  assertKoaError(!app, ctx, 404, 'App not found');
  assertKoaError(!app.icon, ctx, 404, 'App has no icon');

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

  assertKoaError(!app, ctx, 404, 'App not found');
  assertKoaError(!app.maskableIcon, ctx, 404, 'App has no maskable icon');

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

  assertKoaError(!app, ctx, 404, 'App not found');
  assertKoaError(!app.AppScreenshots?.length, ctx, 404, 'Screenshot not found');

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

  assertKoaError(!app, ctx, 404, 'App not found');

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

          assertKoaError(!mime, ctx, 404, `Unknown screenshot mime type: ${mime}`);

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

  assertKoaError(!app, ctx, 404, 'App not found');

  checkAppLock(ctx, app);
  await checkRole(ctx, app.OrganizationId, Permission.EditAppSettings);

  assertKoaError(!app.AppScreenshots.length, ctx, 404, 'Screenshot not found');

  await app.AppScreenshots[0].destroy();
}

export async function importApp(ctx: Context): Promise<void> {
  const {
    openApi,
    pathParams: { organizationId },
    request: { body: importFile },
  } = ctx;
  await checkRole(ctx, organizationId, Permission.EditApps);
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
    if (!path) {
      result.path = `${path}-${randomBytes(5).toString('hex')}`;
    }
    const existingPath = await App.findOne({
      where: { path, OrganizationId: organizationId },
    });
    assertKoaError(existingPath != null, ctx, 409, 'Path  in app definition needs to be unique');
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
      iconBackground: '#ffffff',
    };
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
          const resources = JSON.parse(JSON.stringify(resourcesText.trim().split('\n')));
          const { verifyResourceActionPermission } = options;

          verifyResourceActionPermission({
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
              data: JSON.parse(data),
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

export async function exportApp(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;
  const { resources } = ctx.queryParams;

  const app = await App.findByPk(appId, {
    attributes: ['definition', 'coreStyle', 'OrganizationId', 'sharedStyle'],
    include: [
      { model: AppBlockStyle, required: false },
      { model: AppMessages, required: false },
      { model: Resource, required: false },
    ],
  });

  if (app.visibility === 'public' || !app.showAppDefinition) {
    await checkRole(ctx, app.OrganizationId, Permission.ViewApps);
  }
  const zip = new JSZip();
  zip.file('app-definition.yaml', stringify(app.definition));
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

  if (resources && app.Resources !== undefined) {
    await checkRole(ctx, app.OrganizationId, Permission.EditApps);
    const resourceMap = new Map<string, string>();
    for (const resource of app.Resources) {
      const currentValue = resourceMap.get(resource.type) || '';
      resourceMap.set(resource.type, `${currentValue + JSON.stringify(resource.toJSON())}\n`);
    }
    for (const [resourceType, resourceValue] of resourceMap.entries()) {
      zip.file(`resources/${resourceType}.json`, resourceValue);
    }
  }
  const content = zip.generateNodeStream();
  ctx.attachment();
  ctx.body = content;
  ctx.type = 'application/zip';
  ctx.status = 200;
}

export async function getAppCoreStyle(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, { attributes: ['coreStyle'], raw: true });

  assertKoaError(!app, ctx, 404, 'App not found');

  ctx.body = app.coreStyle || '';
  ctx.type = 'css';
  ctx.status = 200;
}

export async function getAppSharedStyle(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, { attributes: ['sharedStyle'], raw: true });

  assertKoaError(!app, ctx, 404, 'App not found');

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

    assertKoaError(!app, ctx, 404, 'App not found');
    checkAppLock(ctx, app);
    validateStyle(css);

    const block = await BlockVersion.findOne({
      where: { name: blockId, OrganizationId: organizationId },
    });

    assertKoaError(!block, ctx, 404, 'Block not found');

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
      throwKoaError(ctx, 400, 'Provided CSS was invalid.');
    }

    throw error;
  }
}
