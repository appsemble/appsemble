import { logger } from '@appsemble/node-utils';
import { normalize, StyleValidationError, validateStyle } from '@appsemble/utils';
import Boom from '@hapi/boom';
import Ajv from 'ajv';
import crypto from 'crypto';
import jsYaml from 'js-yaml';
import { isEqual, uniqWith } from 'lodash';
import { col, fn, literal, Op, UniqueConstraintError } from 'sequelize';
import sharp from 'sharp';
import * as webpush from 'web-push';

import getAppBlocks from '../utils/getAppBlocks';
import getAppFromRecord from '../utils/getAppFromRecord';
import getDefaultIcon from '../utils/getDefaultIcon';

const ajv = new Ajv();
ajv.addFormat('fontawesome', () => true);

async function checkBlocks(definition, db) {
  const blocks = getAppBlocks(definition);
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
  const blockVersionMap = new Map();
  blockVersions.forEach(version => {
    if (!blockVersionMap.has(version.name)) {
      blockVersionMap.set(version.name, new Map());
    }
    blockVersionMap.get(version.name).set(version.version, version);
  });
  const errors = Object.entries(blocks).reduce((acc, [loc, block]) => {
    const type = block.type.startsWith('@') ? block.type : `@appsemble/${block.type}`;
    const versions = blockVersionMap.get(type);
    if (!versions) {
      return { ...acc, [loc]: `Unknown block type “${type}”` };
    }
    if (!versions.has(block.version)) {
      return { ...acc, [loc]: `Unknown block version “${type}@${block.version}”` };
    }
    const version = versions.get(block.version);
    if (Object.prototype.hasOwnProperty.call(version, 'parameters')) {
      const validate = ajv.compile(version.parameters);
      const valid = validate(block.parameters);
      if (!valid) {
        return validate.errors.reduce(
          (accumulator, error) => ({
            ...accumulator,
            [`${loc}.parameters${error.dataPath}`]: error,
          }),
          acc,
        );
      }
    }
    return acc;
  }, null);
  if (errors) {
    throw Boom.badRequest('Block validation failed', errors);
  }
}

function handleAppValidationError(error, app) {
  if (error instanceof UniqueConstraintError) {
    throw Boom.conflict(
      `Another app with path “@${app.OrganizationId}/${app.path}” already exists`,
    );
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
  const { user } = ctx.state;
  const {
    definition,
    OrganizationId,
    domain,
    private: isPrivate = true,
    template = false,
    yaml,
    icon,
    style,
    sharedStyle,
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

    if (!user.organizations.some(organization => organization.id === OrganizationId)) {
      throw Boom.forbidden('User does not belong in this organization.');
    }

    await checkBlocks(definition, db);

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

    const record = await App.create(result, { raw: true });

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
  const { App, AppRating } = ctx.db.models;
  const {
    user: { organizations },
  } = ctx.state;

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
    where: { OrganizationId: { [Op.in]: organizations.map(o => o.id) } },
  });
  const ignoredFields = ['yaml'];
  ctx.body = apps.map(app => getAppFromRecord(app, ignoredFields));
}

export async function updateApp(ctx) {
  const { db } = ctx;
  const { appId } = ctx.params;
  const {
    user: { organizations },
  } = ctx.state;
  const { App } = db.models;
  const { definition, domain, path, style, sharedStyle, yaml, OrganizationId } = ctx.request.body;

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

    await checkBlocks(definition, db);

    const dbApp = await App.findOne({ where: { id: appId } });

    if (!dbApp) {
      throw Boom.notFound('App not found');
    }

    if (!organizations.some(organization => organization.id === OrganizationId)) {
      throw Boom.forbidden("User does not belong in this App's organization.");
    }

    await dbApp.update(result, { where: { id: appId } });

    ctx.body = getAppFromRecord({ ...dbApp.dataValues, ...result });
  } catch (error) {
    handleAppValidationError(error, result);
  }
}

export async function patchApp(ctx) {
  const { db } = ctx;
  const { appId } = ctx.params;
  const {
    user: { organizations },
  } = ctx.state;
  const { App } = db.models;
  const {
    definition,
    path,
    domain,
    private: isPrivate,
    template,
    style,
    sharedStyle,
    yaml,
    icon,
  } = ctx.request.body;

  let result;

  try {
    result = {};

    if (definition) {
      result.definition = definition;
      await checkBlocks(definition, db);
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

    if (!organizations.some(organization => organization.id === dbApp.OrganizationId)) {
      throw Boom.forbidden("User does not belong in this App's organization.");
    }

    await dbApp.update(result, { where: { id: appId } });

    ctx.body = getAppFromRecord({ ...dbApp.dataValues, ...result });
  } catch (error) {
    handleAppValidationError(error, result);
  }
}

export async function deleteApp(ctx) {
  const { appId } = ctx.params;
  const { App } = ctx.db.models;
  const {
    user: { organizations },
  } = ctx.state;

  const app = await App.findByPk(appId);

  if (!app) {
    throw Boom.notFound('App not found');
  }

  if (!organizations.some(organization => organization.id === app.OrganizationId)) {
    throw Boom.forbidden("User does not belong in this App's organization.");
  }

  await app.update({ path: null });
  await app.destroy();
}

export async function getAppRatings(ctx) {
  const { appId } = ctx.params;
  const { AppRating, User } = ctx.db.models;

  const ratings = await AppRating.findAll({ where: { AppId: appId }, include: [User], raw: true });
  ctx.body = ratings.map(({ rating, description, UserId, created, updated, ...r }) => ({
    rating,
    description,
    UserId,
    name: r['User.name'],
    $created: created,
    $updated: updated,
  }));
}

export async function submitAppRating(ctx) {
  const { appId: AppId } = ctx.params;
  const { App, AppRating, User } = ctx.db.models;
  const {
    user: { id: userId },
  } = ctx.state;
  const { rating, description } = ctx.request.body;

  const app = await App.findByPk(AppId);
  const user = await User.findByPk(userId);

  if (!app) {
    throw Boom.notFound('App not found');
  }

  const [result] = await AppRating.upsert(
    { rating, description, UserId: user.id, AppId },
    { returning: true },
  );

  ctx.body = {
    rating,
    description,
    UserId: user.id,
    name: user.name,
    $created: result.created,
    $updated: result.updated,
  };
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

export async function setAppIcon(ctx) {
  const { appId } = ctx.params;
  const { App } = ctx.db.models;
  const {
    user: { organizations },
  } = ctx.state;
  const icon = ctx.request.body;

  const app = await App.findOne({ where: { id: appId } });

  if (!app) {
    throw Boom.notFound('App not found');
  }

  if (!organizations.some(organization => organization.id === app.OrganizationId)) {
    throw Boom.forbidden("User does not belong in this App's organization.");
  }

  await app.update({ icon });
  ctx.status = 204;
}

export async function deleteAppIcon(ctx) {
  const { appId } = ctx.params;
  const { App } = ctx.db.models;
  const {
    user: { organizations },
  } = ctx.state;

  const app = await App.findOne({ where: { id: appId } });

  if (!app) {
    throw Boom.notFound('App not found');
  }

  if (!organizations.some(organization => organization.id === app.OrganizationId)) {
    throw Boom.forbidden("User does not belong in this App's organization.");
  }

  await app.update({ icon: null });

  ctx.status = 204;
}

export async function addSubscription(ctx) {
  const { appId } = ctx.params;
  const { App, AppSubscription } = ctx.db.models;
  const { user } = ctx.state;
  const { endpoint, keys } = ctx.request.body;

  const app = await App.findByPk(appId, { include: [AppSubscription] });

  if (!app) {
    throw Boom.notFound('App not found');
  }

  await app.createAppSubscription({
    endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
    UserId: user ? user.id : null,
  });
}

export async function broadcast(ctx) {
  const { appId } = ctx.params;
  const { App, AppSubscription } = ctx.db.models;
  const { user } = ctx.state;
  const { title, body } = ctx.request.body;

  const app = await App.findByPk(appId, {
    include: [AppSubscription],
  });

  if (!app) {
    throw Boom.notFound('App not found');
  }

  if (!user.organizations.some(organization => organization.id === app.OrganizationId)) {
    throw Boom.forbidden('User does not belong in this app’s organization.');
  }

  const { vapidPublicKey: publicKey, vapidPrivateKey: privateKey } = app;

  // XXX: Replace with paginated requests
  logger.verbose(`Sending ${app.AppSubscriptions.length} notifications for app ${app.id}`);
  app.AppSubscriptions.forEach(async subscription => {
    try {
      logger.verbose(
        `Sending push notification based on subscription ${subscription.id} for app ${app.id}`,
      );
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: { auth: subscription.auth, p256dh: subscription.p256dh },
        },
        JSON.stringify({
          title,
          body,
          icon: `${ctx.argv.host}/${app.id}/icon-96.png`,
          badge: `${ctx.argv.host}/${app.id}/icon-96.png`,
          timestamp: Date.now(),
        }),
        {
          vapidDetails: {
            // XXX: Make this configurable
            subject: 'mailto: support@appsemble.com',
            publicKey,
            privateKey,
          },
        },
      );
    } catch (error) {
      if (!(error instanceof webpush.WebPushError && error.statusCode === 410)) {
        throw error;
      }

      logger.verbose(
        `Removing push notification subscription ${subscription.id} for app ${app.id}`,
      );
      await subscription.destroy();
    }
  });
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
  const { appId, organizationId, blockId } = ctx.params;
  const { AppBlockStyle } = ctx.db.models;

  const blockStyle = await AppBlockStyle.findOne({
    where: {
      AppId: appId,
      BlockDefinitionId: `@${organizationId}/${blockId}`,
    },
  });

  ctx.body = blockStyle && blockStyle.style ? blockStyle.style : '';
  ctx.type = 'css';
  ctx.status = 200;
}

export async function setAppBlockStyle(ctx) {
  const { appId, organizationId, blockId } = ctx.params;
  const { db } = ctx;
  const { App, AppBlockStyle, BlockDefinition } = db.models;
  const { style } = ctx.request.body;
  const css = style.toString().trim();

  try {
    validateStyle(css);

    const app = await App.findByPk(appId);
    if (!app) {
      throw Boom.notFound('App not found.');
    }

    const block = await BlockDefinition.findByPk(`@${organizationId}/${blockId}`);
    if (!block) {
      throw Boom.notFound('Block not found.');
    }

    if (css.length) {
      await AppBlockStyle.upsert({
        style: css.toString(),
        AppId: app.id,
        BlockDefinitionId: block.id,
      });
    } else {
      await AppBlockStyle.destroy({ where: { AppId: app.id, BlockDefinitionId: block.id } });
    }

    ctx.status = 204;
  } catch (e) {
    if (e instanceof StyleValidationError) {
      throw Boom.badRequest('Provided CSS was invalid.');
    }

    throw e;
  }
}
