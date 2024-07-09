import { basename, dirname } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

import {
  AppsembleError,
  assertKoaError,
  deleteCompanionContainers,
  formatServiceName,
  getSupportedLanguages,
  handleValidatorResult,
  logger,
  serveIcon,
  throwKoaError,
  updateCompanionContainers,
} from '@appsemble/node-utils';
import { type AppDefinition, type App as AppType, type BlockManifest } from '@appsemble/types';
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
import { col, fn, literal, Op, type Transaction, UniqueConstraintError } from 'sequelize';
import sharp from 'sharp';
import webpush from 'web-push';
import { parse, stringify } from 'yaml';

import {
  App,
  AppBlockStyle,
  AppMessages,
  AppRating,
  AppReadme,
  AppScreenshot,
  AppSnapshot,
  Asset,
  BlockVersion,
  Organization,
  OrganizationMember,
  Resource,
  transactional,
  User,
} from '../models/index.js';
import { getUserAppAccount } from '../options/getUserAppAccount.js';
import { options } from '../options/options.js';
import { applyAppMessages, compareApps, parseLanguage, setAppPath } from '../utils/app.js';
import { argv } from '../utils/argv.js';
import { blockVersionToJson, syncBlock } from '../utils/block.js';
import { checkAppLock } from '../utils/checkAppLock.js';
import { checkRole } from '../utils/checkRole.js';
import { encrypt } from '../utils/crypto.js';
import {
  processHooks,
  processReferenceHooks,
  reseedResourcesRecursively,
} from '../utils/resource.js';

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

async function createAppScreenshots(
  appId: number,
  screenshots: File[],
  transaction: Transaction,
  ctx: Context,
): Promise<AppScreenshot[]> {
  const screenshotsByLanguage: Record<string, File[]> = {};
  const supportedLanguages = await getSupportedLanguages();

  for (const screenshot of screenshots) {
    const { filename } = screenshot;
    let language = filename.slice(0, filename.indexOf('-'));

    if (!supportedLanguages.has(language)) {
      language = 'unspecified';
    }

    screenshotsByLanguage[language] = [...(screenshotsByLanguage[language] || []), screenshot];
  }

  let createdScreenshots: AppScreenshot[] = [];
  for (const [language, languageScreenshots] of Object.entries(screenshotsByLanguage)) {
    const lastExistingScreenshot = await AppScreenshot.findOne({
      where: {
        AppId: appId,
        language,
      },
      attributes: ['index', 'language'],
      order: [['index', 'DESC']],
    });

    const sortedScreenshots = languageScreenshots.sort((a, b) => {
      const { filename: aFilename } = a;
      const { filename: bFilename } = b;
      if (aFilename > bFilename) {
        return 1;
      }
      if (aFilename < bFilename) {
        return -1;
      }
      return 0;
    });

    logger.verbose(`Storing ${languageScreenshots?.length ?? 0} ${language} screenshots`);

    const createdLanguageScreenshots = await AppScreenshot.bulkCreate(
      await Promise.all(
        sortedScreenshots.map(async ({ contents }: File, index) => {
          const img = sharp(contents);

          const { format, height, width } = await img.metadata();
          const mime = lookup(format);

          assertKoaError(!mime, ctx, 404, `Unknown screenshot mime type: ${mime}`);

          return {
            screenshot: contents,
            AppId: appId,
            index: lastExistingScreenshot ? lastExistingScreenshot.index + index + 1 : index,
            language,
            mime,
            width,
            height,
          };
        }),
      ),
      // These queries provide huge logs.
      { transaction, logging: false },
    );

    createdScreenshots = [...createdScreenshots, ...createdLanguageScreenshots];
  }

  return createdScreenshots;
}

async function createAppReadmes(
  appId: number,
  readmes: File[],
  transaction: Transaction,
): Promise<AppReadme[]> {
  const supportedLanguages = await getSupportedLanguages();

  return AppReadme.bulkCreate(
    await Promise.all(
      readmes.map(({ contents, filename }: File) => {
        let language = filename.slice(filename.indexOf('.') + 1, filename.lastIndexOf('.'));

        if (!supportedLanguages.has(language)) {
          language = 'unspecified';
        }

        return {
          AppId: appId,
          file: contents,
          language,
        };
      }),
    ),
    // These queries provide huge logs.
    { transaction, logging: false },
  );
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
        maskableIcon,
        readmes,
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
    const definition = parse(yaml, { maxAliasCount: 10_000 }) as AppDefinition;

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
    result.containers = definition.containers;
    result.registry = definition.registry;
    if (icon) {
      result.icon = icon.contents;
    }

    if (maskableIcon) {
      result.maskableIcon = maskableIcon.contents;
    }

    await setAppPath(ctx, result, path);

    let record: App;
    try {
      await transactional(async (transaction) => {
        record = await App.create(result, { transaction });

        record.AppSnapshots = [
          await AppSnapshot.create({ AppId: record.id, yaml }, { transaction }),
        ];

        record.AppScreenshots = screenshots?.length
          ? await createAppScreenshots(record.id, screenshots, transaction, ctx)
          : [];

        record.AppReadmes = readmes?.length
          ? await createAppReadmes(record.id, readmes, transaction)
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

    const containerDefinitions = record.containers;

    if (containerDefinitions && containerDefinitions.length > 0) {
      await updateCompanionContainers(
        containerDefinitions,
        record.definition.name,
        String(record.id),
        record.registry,
      );
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

  const languageScreenshot = await AppScreenshot.findOne({
    attributes: ['language'],
    where: {
      AppId: appId,
      ...(language ? { language } : {}),
    },
  });

  const unspecifiedScreenshot = await AppScreenshot.findOne({
    attributes: ['language'],
    where: {
      AppId: appId,
      language: 'unspecified',
    },
  });

  const languageReadme = await AppReadme.findOne({
    attributes: ['language'],
    where: {
      AppId: appId,
      ...(language ? { language } : {}),
    },
  });

  const unspecifiedReadme = await AppReadme.findOne({
    attributes: ['language'],
    where: {
      AppId: appId,
      language: 'unspecified',
    },
  });

  const app = await App.findByPk(appId, {
    attributes: {
      include: [
        [literal('"App".icon IS NOT NULL'), 'hasIcon'],
        [literal('"maskableIcon" IS NOT NULL'), 'hasMaskableIcon'],
      ],
      exclude: ['App.icon', 'maskableIcon', 'coreStyle', 'sharedStyle'],
    },
    include: [
      {
        model: Resource,
        attributes: ['id', 'clonable'],
        required: false,
        separate: true,
      },
      {
        model: Asset,
        attributes: ['id', 'clonable'],
        required: false,
        separate: true,
      },
      { model: AppSnapshot, as: 'AppSnapshots', order: [['created', 'DESC']], limit: 1 },
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
      {
        model: AppScreenshot,
        attributes: ['id', 'index', 'language'],
        where: {
          language:
            language && languageScreenshot
              ? language
              : unspecifiedScreenshot
                ? 'unspecified'
                : 'en',
        },
        required: false,
      },
      {
        model: AppReadme,
        attributes: ['id', 'language'],
        where: {
          language:
            language && languageReadme ? language : unspecifiedReadme ? 'unspecified' : 'en',
        },
        required: false,
      },
      ...languageQuery,
    ],
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
        enableUnsecuredServiceSecrets,
        googleAnalyticsID,
        icon,
        iconBackground,
        maskableIcon,
        path,
        readmes,
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
      { model: AppReadme, attributes: ['id'] },
    ],
  });

  assertKoaError(!dbApp, ctx, 404, 'App not found');

  checkAppLock(ctx, dbApp);

  const checkPermissions: Permission[] = [];

  try {
    result = {};

    if (yaml) {
      checkPermissions.push(Permission.EditApps);
      const definition = parse(yaml, { maxAliasCount: 10_000 }) as AppDefinition;

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

      // Make the actual update
      await updateCompanionContainers(
        definition.containers ?? [],
        dbApp.definition.name,
        String(appId),
        definition.registry,
      );

      result.containers = definition.containers;
      result.registry = definition.registry;
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

    if (enableUnsecuredServiceSecrets !== undefined) {
      result.enableUnsecuredServiceSecrets = enableUnsecuredServiceSecrets;
    }

    if (coreStyle !== undefined) {
      result.coreStyle = validateStyle(coreStyle);
    }

    if (sharedStyle !== undefined) {
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
        dbApp.AppScreenshots = await createAppScreenshots(appId, screenshots, transaction, ctx);
      }

      if (readmes?.length) {
        await AppReadme.destroy({ where: { AppId: appId }, transaction });
        dbApp.AppReadmes = await createAppReadmes(appId, readmes, transaction);
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
  if (app.locked === 'fullLock' && !ctx.client) {
    throwKoaError(ctx, 403, 'This app can only be unlocked from the CLI.');
  }

  await checkRole(ctx, app.OrganizationId, Permission.EditAppSettings);
  await app.update({ locked });
}

export async function deleteApp(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, { attributes: ['id', 'OrganizationId', 'definition'] });

  assertKoaError(!app, ctx, 404, 'App not found');

  await checkRole(ctx, app.OrganizationId, Permission.DeleteApps);

  await app.update({ path: null });
  await app.destroy();

  if (app.definition.containers && app.definition.containers.length > 0) {
    for (const def of app.definition.containers) {
      await deleteCompanionContainers(
        formatServiceName(def.name, app.definition?.name, String(appId)),
      );
    }
  }
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

export async function getAppReadme(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, readmeId },
  } = ctx;
  const app = await App.findByPk(appId, {
    attributes: [],
    include: [
      {
        attributes: ['file'],
        model: AppReadme,
        required: false,
        where: { id: readmeId },
      },
    ],
  });

  assertKoaError(!app, ctx, 404, 'App not found');
  assertKoaError(!app.AppReadmes?.length, ctx, 404, 'Readme not found');

  const [{ file }] = app.AppReadmes;

  ctx.body = file;
  ctx.type = 'text/markdown';
}

export async function createAppScreenshot(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: { language, screenshots },
    },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['id', 'OrganizationId'],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  checkAppLock(ctx, app);
  await checkRole(ctx, app.OrganizationId, Permission.EditAppSettings);

  const languageScreenshot = await AppScreenshot.findOne({
    attributes: ['language'],
    where: {
      AppId: appId,
      ...(language ? { language } : {}),
    },
  });

  const languageScreenshots = screenshots.map((screenshot: File) => {
    const { filename } = screenshot;
    return {
      ...screenshot,
      filename: `${languageScreenshot ? language : 'unspecified'}-${filename}`,
    };
  });

  let result: AppScreenshot[] = [];
  await transactional(async (transaction) => {
    result = await createAppScreenshots(appId, languageScreenshots, transaction, ctx);
  });

  ctx.body = result.map((screenshot) => screenshot.id);
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

export async function reseedDemoApp(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['demoMode', 'definition'],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  assertKoaError(!app.demoMode, ctx, 400, 'App is not in demo mode');

  logger.info('Cleaning up ephemeral assets.');

  const demoAssetsDeletionResult = await Asset.destroy({
    where: {
      ephemeral: true,
      AppId: appId,
    },
  });

  logger.info(`Removed ${demoAssetsDeletionResult} ephemeral assets.`);

  const demoAssetsToReseed = await Asset.findAll({
    attributes: ['mime', 'filename', 'data', 'name', 'AppId', 'ResourceId'],
    include: [
      {
        model: App,
        attributes: ['id'],
        where: {
          id: appId,
          demoMode: true,
        },
        required: true,
      },
    ],
    where: {
      seed: true,
    },
  });

  logger.info('Reseeding ephemeral assets.');

  for (const asset of demoAssetsToReseed) {
    await Asset.create({
      ...asset.dataValues,
      ephemeral: true,
      seed: false,
    });
  }

  logger.info(`Reseeded ${demoAssetsToReseed.length} ephemeral assets.`);

  const date = new Date();

  logger.info(
    `Cleaning up ephemeral resources and resources with an expiry date earlier than ${date.toISOString()}.`,
  );

  const demoResourcesDeletionResult = await Resource.destroy({
    where: {
      [Op.or]: [{ seed: false, expires: { [Op.lt]: date } }, { ephemeral: true }],
      [Op.and]: { AppId: appId },
    },
  });

  logger.info(`Removed ${demoResourcesDeletionResult} ephemeral resources.`);

  const demoResourcesToReseed = await Resource.findAll({
    attributes: ['type', 'data', 'AppId', 'AuthorId'],
    include: [
      {
        model: App,
        attributes: ['definition'],
        where: {
          id: appId,
          demoMode: true,
        },
        required: true,
      },
    ],
    where: {
      seed: true,
    },
  });

  logger.info('Reseeding ephemeral resources.');

  await reseedResourcesRecursively(app.definition, demoResourcesToReseed);

  logger.info(`Reseeded ${demoResourcesToReseed.length} ephemeral resources.`);
}
