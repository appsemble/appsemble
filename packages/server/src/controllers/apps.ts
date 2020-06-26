import type { BlockManifest } from '@appsemble/types';
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
import Boom from '@hapi/boom';
import crypto from 'crypto';
import jsYaml from 'js-yaml';
import { isEqual, uniqWith } from 'lodash';
import { col, fn, literal, Op, UniqueConstraintError } from 'sequelize';
import sharp from 'sharp';
import * as webpush from 'web-push';

import { App, AppBlockStyle, AppRating, BlockVersion, Member } from '../models';
import type { KoaContext } from '../types';
import checkRole from '../utils/checkRole';
import getAppFromRecord from '../utils/getAppFromRecord';
import readAsset from '../utils/readAsset';

interface Params {
  appId: number;
  blockId: string;
  organizationId: string;
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
    throw Boom.conflict(
      `Another app with path “@${app.OrganizationId}/${app.path}” already exists`,
    );
  }

  if (error instanceof AppsembleValidationError) {
    throw Boom.badRequest('Appsemble definition is invalid.', error.data || error.message);
  }

  if (error instanceof StyleValidationError) {
    throw Boom.badRequest('Provided CSS was invalid.');
  }

  if (error.message === 'Expected file ´style´ to be css') {
    throw Boom.badRequest(error.message);
  }

  if (error.message === 'Expected file ´sharedStyle´ to be css') {
    throw Boom.badRequest(error.message);
  }

  throw error;
}

export async function createApp(ctx: KoaContext): Promise<void> {
  const {
    request: {
      body: {
        OrganizationId,
        definition,
        domain,
        icon,
        private: isPrivate = true,
        sharedStyle,
        style,
        template = false,
        yaml,
      },
    },
  } = ctx;

  let result: Partial<App>;

  try {
    const path = normalize(definition.name);
    const keys = webpush.generateVAPIDKeys();

    result = {
      definition,
      OrganizationId,
      style: validateStyle(style),
      sharedStyle: validateStyle(sharedStyle),
      domain: domain || null,
      private: Boolean(isPrivate),
      template: Boolean(template),
      yaml: yaml || jsYaml.safeDump(definition),
      icon,
      vapidPublicKey: keys.publicKey,
      vapidPrivateKey: keys.privateKey,
    };

    if (yaml) {
      try {
        // The YAML should be valid YAML.
        jsYaml.safeLoad(yaml);
      } catch (exception) {
        throw Boom.badRequest('Provided YAML was invalid.');
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
      result.path = `${path}-${crypto.randomBytes(5).toString('hex')}`;
    }

    const record = await App.create(result);

    ctx.body = getAppFromRecord(record);
    ctx.status = 201;
  } catch (error) {
    handleAppValidationError(error, result);
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
      ],
      exclude: ['icon', 'style', 'sharedStyle'],
    },
    include: [{ model: AppRating, attributes: [] }],
    group: ['App.id'],
  });

  if (!app) {
    throw Boom.notFound('App not found');
  }

  ctx.body = getAppFromRecord(app);
}

export async function queryApps(ctx: KoaContext): Promise<void> {
  const apps = await App.findAll({
    attributes: {
      include: [
        [fn('AVG', col('AppRatings.rating')), 'RatingAverage'],
        [fn('COUNT', col('AppRatings.AppId')), 'RatingCount'],
      ],
      exclude: ['yaml', 'icon', 'style', 'sharedStyle'],
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
      exclude: ['yaml', 'icon', 'style', 'sharedStyle'],
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
      body: { definition, domain, path, sharedStyle, style, yaml },
    },
  } = ctx;

  let result;

  try {
    result = {
      definition,
      style: validateStyle(style?.contents),
      sharedStyle: validateStyle(sharedStyle?.contents),
      domain,
      path: path || normalize(definition.name),
      yaml: yaml?.toString('utf8'),
    };

    if (yaml) {
      let appFromYaml;
      try {
        // The YAML should be valid YAML.
        appFromYaml = jsYaml.safeLoad(yaml);
      } catch (exception) {
        throw Boom.badRequest('Provided YAML was invalid.');
      }

      // The YAML should be the same when converted to JSON.
      if (!isEqual(appFromYaml, definition)) {
        throw Boom.badRequest('Provided YAML was not equal to definition when converted.');
      }
    } else {
      result.yaml = jsYaml.safeDump(definition);
    }

    await validateAppDefinition(definition, getBlockVersions);

    const dbApp = await App.findOne({ where: { id: appId } });

    if (!dbApp) {
      throw Boom.notFound('App not found');
    }

    await checkRole(ctx, dbApp.OrganizationId, [Permission.EditApps, Permission.EditAppSettings]);
    await dbApp.update(result, { where: { id: appId } });

    ctx.body = getAppFromRecord(dbApp);
  } catch (error) {
    handleAppValidationError(error, result);
  }
}

export async function patchApp(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId },
    request: {
      body: {
        definition,
        domain,
        icon,
        path,
        private: isPrivate,
        sharedStyle,
        style,
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

    if (style) {
      result.style = validateStyle(style.contents);
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
        appFromYaml = jsYaml.safeLoad(yaml);
      } catch (exception) {
        throw Boom.badRequest('Provided YAML was invalid.');
      }

      // The YAML should be the same when converted to JSON.
      if (!isEqual(appFromYaml, definition)) {
        throw Boom.badRequest('Provided YAML was not equal to definition when converted.');
      }

      result.yaml = (yaml.contents && yaml.contents.toString('utf8')) || yaml;
    } else if (definition) {
      result.yaml = jsYaml.safeDump(definition);
    }

    const dbApp = await App.findOne({ where: { id: appId } });

    if (!dbApp) {
      throw Boom.notFound('App not found');
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

    await dbApp.update(result, { where: { id: appId } });

    ctx.body = getAppFromRecord(dbApp);
  } catch (error) {
    handleAppValidationError(error, result);
  }
}

export async function deleteApp(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId },
  } = ctx;

  const app = await App.findByPk(appId);

  if (!app) {
    throw Boom.notFound('App not found');
  }

  await checkRole(ctx, app.OrganizationId, Permission.DeleteApps);

  await app.update({ path: null });
  await app.destroy();
}

export async function getAppIcon(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId },
  } = ctx;
  const app = await App.findByPk(appId, { raw: true });

  if (!app) {
    throw Boom.notFound('App not found');
  }

  const icon = app.icon || (await readAsset('appsemble.svg'));
  const metadata = await sharp(icon).metadata();

  ctx.body = icon;
  // Type svg resolves to text/xml instead of image/svg+xml.
  ctx.type = metadata.format === 'svg' ? 'image/svg+xml' : metadata.format;
}

export async function getAppCoreStyle(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId },
  } = ctx;

  const app = await App.findByPk(appId, { raw: true });

  if (!app) {
    throw Boom.notFound('App not found');
  }

  ctx.body = app.style || '';
  ctx.type = 'css';
  ctx.status = 200;
}

export async function getAppSharedStyle(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId },
  } = ctx;

  const app = await App.findByPk(appId, { raw: true });

  if (!app) {
    throw Boom.notFound('App not found');
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
  const css = style.toString().trim();

  try {
    validateStyle(css);

    const app = await App.findByPk(appId);
    if (!app) {
      throw Boom.notFound('App not found.');
    }

    const block = await BlockVersion.findOne({
      where: { name: blockId, OrganizationId: organizationId },
    });
    if (!block) {
      throw Boom.notFound('Block not found.');
    }

    await checkRole(ctx, app.OrganizationId, Permission.EditApps);

    if (css.length) {
      await AppBlockStyle.upsert({
        style: css.toString(),
        AppId: app.id,
        block: `@${block.OrganizationId}/${block.name}`,
      });
    } else {
      await AppBlockStyle.destroy({
        where: { AppId: app.id, block: `@${block.OrganizationId}/${block.name}` },
      });
    }

    ctx.status = 204;
  } catch (e) {
    if (e instanceof StyleValidationError) {
      throw Boom.badRequest('Provided CSS was invalid.');
    }

    throw e;
  }
}
