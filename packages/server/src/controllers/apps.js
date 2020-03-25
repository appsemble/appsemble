import {
  AppsembleValidationError,
  normalize,
  permissions,
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

import checkRole from '../utils/checkRole';
import getAppFromRecord from '../utils/getAppFromRecord';
import getDefaultIcon from '../utils/getDefaultIcon';

function getBlockVersions(db) {
  return async blocks => {
    const blockVersions = await db.models.BlockVersion.findAll({
      raw: true,
      where: {
        [Op.or]: uniqWith(
          Object.values(blocks).map(({ type, version }) => ({
            name: type.startsWith('@') ? type : `@appsemble/${type}`,
            version,
          })),
          isEqual,
        ),
      },
    });

    return blockVersions;
  };
}

function handleAppValidationError(error, app) {
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

export async function createApp(ctx) {
  const { db } = ctx;
  const { App } = db.models;
  const {
    OrganizationId,
    definition,
    domain,
    icon,
    private: isPrivate = true,
    sharedStyle,
    style,
    template = false,
    yaml,
  } = ctx.request.body;

  let result;

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

    await checkRole(ctx, OrganizationId, permissions.CreateApps);
    await validateAppDefinition(definition, getBlockVersions(ctx.db));

    for (let i = 1; i < 11; i += 1) {
      const p = i === 1 ? path : `${path}-${i}`;
      // eslint-disable-next-line no-await-in-loop
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

export async function getAppById(ctx) {
  const { appId } = ctx.params;
  const { App, AppRating } = ctx.db.models;

  const app = await App.findByPk(appId, {
    raw: true,
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

export async function queryApps(ctx) {
  const { App, AppRating } = ctx.db.models;

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
    raw: true,
  });
  const ignoredFields = ['yaml'];
  ctx.body = apps.map(app => getAppFromRecord(app, ignoredFields));
}

export async function queryMyApps(ctx) {
  const { App, AppRating, Member } = ctx.db.models;
  const { user } = ctx.state;

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
    where: { OrganizationId: { [Op.in]: memberships.map(m => m.OrganizationId) } },
  });
  const ignoredFields = ['yaml'];
  ctx.body = apps.map(app => getAppFromRecord(app, ignoredFields));
}

export async function updateApp(ctx) {
  const { db } = ctx;
  const { appId } = ctx.params;
  const { App } = db.models;
  const { definition, domain, path, sharedStyle, style, yaml } = ctx.request.body;

  let result;

  try {
    result = {
      definition,
      style: validateStyle(style && style.contents),
      sharedStyle: validateStyle(sharedStyle && sharedStyle.contents),
      domain,
      path: path || normalize(definition.name),
      yaml: yaml && yaml.toString('utf8'),
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

    await validateAppDefinition(definition, getBlockVersions(ctx.db));

    const dbApp = await App.findOne({ where: { id: appId } });

    if (!dbApp) {
      throw Boom.notFound('App not found');
    }

    await checkRole(ctx, dbApp.OrganizationId, [permissions.EditApps, permissions.EditAppSettings]);
    await dbApp.update(result, { where: { id: appId } });

    ctx.body = getAppFromRecord({ ...dbApp.dataValues, ...result });
  } catch (error) {
    handleAppValidationError(error, result);
  }
}

export async function patchApp(ctx) {
  const { db } = ctx;
  const { appId } = ctx.params;
  const { App } = db.models;
  const {
    definition,
    domain,
    icon,
    path,
    private: isPrivate,
    sharedStyle,
    style,
    template,
    yaml,
  } = ctx.request.body;

  let result;

  try {
    result = {};

    if (definition) {
      result.definition = definition;
      await validateAppDefinition(definition, getBlockVersions(ctx.db));
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

    const checkPermissions = [];

    if (
      domain !== undefined ||
      path !== undefined ||
      isPrivate !== undefined ||
      template !== undefined
    ) {
      checkPermissions.push(permissions.EditAppSettings);
    }

    if (yaml || definition) {
      checkPermissions.push(permissions.EditApps);
    }

    await checkRole(ctx, dbApp.OrganizationId, checkPermissions);

    await dbApp.update(result, { where: { id: appId } });

    ctx.body = getAppFromRecord({ ...dbApp.dataValues, ...result });
  } catch (error) {
    handleAppValidationError(error, result);
  }
}

export async function deleteApp(ctx) {
  const { appId } = ctx.params;
  const { App } = ctx.db.models;

  const app = await App.findByPk(appId);

  if (!app) {
    throw Boom.notFound('App not found');
  }

  await checkRole(ctx, app.OrganizationId, permissions.DeleteApps);

  await app.update({ path: null });
  await app.destroy();
}

export async function getAppIcon(ctx) {
  const { appId } = ctx.params;
  const { App } = ctx.db.models;
  const app = await App.findByPk(appId, { raw: true });

  if (!app) {
    throw Boom.notFound('App not found');
  }

  const icon = app.icon || getDefaultIcon();
  const metadata = await sharp(icon).metadata();

  ctx.body = icon;
  // Type svg resolves to text/xml instead of image/svg+xml.
  ctx.type = metadata.format === 'svg' ? 'image/svg+xml' : metadata.format;
}

export async function getAppCoreStyle(ctx) {
  const { appId } = ctx.params;
  const { App } = ctx.db.models;

  const app = await App.findByPk(appId, { raw: true });

  if (!app) {
    throw Boom.notFound('App not found');
  }

  ctx.body = app.style || '';
  ctx.type = 'css';
  ctx.status = 200;
}

export async function getAppSharedStyle(ctx) {
  const { appId } = ctx.params;
  const { App } = ctx.db.models;

  const app = await App.findByPk(appId, { raw: true });

  if (!app) {
    throw Boom.notFound('App not found');
  }

  ctx.body = app.sharedStyle || '';
  ctx.type = 'css';
  ctx.status = 200;
}

export async function getAppBlockStyle(ctx) {
  const { appId, blockId, organizationId } = ctx.params;
  const { AppBlockStyle } = ctx.db.models;

  const blockStyle = await AppBlockStyle.findOne({
    where: {
      AppId: appId,
      block: `@${organizationId}/${blockId}`,
    },
  });

  ctx.body = blockStyle && blockStyle.style ? blockStyle.style : '';
  ctx.type = 'css';
  ctx.status = 200;
}

export async function setAppBlockStyle(ctx) {
  const { appId, blockId, organizationId } = ctx.params;
  const { db } = ctx;
  const { App, AppBlockStyle, BlockVersion } = db.models;
  const { style } = ctx.request.body;
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

    await checkRole(ctx, app.OrganizationId, permissions.EditApps);

    if (css.length) {
      await AppBlockStyle.upsert({
        style: css.toString(),
        AppId: app.id,
        block: block.id,
      });
    } else {
      await AppBlockStyle.destroy({ where: { AppId: app.id, block: block.id } });
    }

    ctx.status = 204;
  } catch (e) {
    if (e instanceof StyleValidationError) {
      throw Boom.badRequest('Provided CSS was invalid.');
    }

    throw e;
  }
}
