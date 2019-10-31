import { normalize, StyleValidationError, validateStyle } from '@appsemble/utils';
import Boom from '@hapi/boom';
import Ajv from 'ajv';
import crypto from 'crypto';
import jsYaml from 'js-yaml';
import { isEqual, uniqWith } from 'lodash';
import { Op, UniqueConstraintError } from 'sequelize';
import sharp from 'sharp';

import getAppBlocks from '../utils/getAppBlocks';
import getAppFromRecord from '../utils/getAppFromRecord';
import getDefaultIcon from '../utils/getDefaultIcon';

const ajv = new Ajv();
ajv.addFormat('fontawesome', () => true);

async function checkBlocks(app, db) {
  const blocks = getAppBlocks(app);
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
  const { app, style, sharedStyle } = ctx.request.body;

  let result;

  try {
    const path = normalize(app.definition.name);

    result = {
      definition: app.definition,
      OrganizationId: app.OrganizationId,
      style: validateStyle(style),
      sharedStyle: validateStyle(sharedStyle),
      domain: app.domain || null,
      private: Boolean(app.private),
      yaml: jsYaml.safeDump(app.definition),
    };

    if (!user.organizations.some(organization => organization.id === app.OrganizationId)) {
      throw Boom.forbidden('User does not belong in this organization.');
    }

    await checkBlocks(app, db);

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
  const { App } = ctx.db.models;

  const app = await App.findByPk(appId, { raw: true });

  if (!app) {
    throw Boom.notFound('App not found');
  }

  ctx.body = getAppFromRecord(app);
}

export async function queryApps(ctx) {
  const { App } = ctx.db.models;

  const apps = await App.findAll({
    where: { private: false },
    raw: true,
  });
  ctx.body = apps.map(getAppFromRecord);
}

export async function queryMyApps(ctx) {
  const { App } = ctx.db.models;
  const {
    user: { organizations },
  } = ctx.state;

  const apps = await App.findAll({
    where: { OrganizationId: { [Op.in]: organizations.map(o => o.id) } },
  });

  ctx.body = apps.map(getAppFromRecord);
}

export async function updateApp(ctx) {
  const { db } = ctx;
  const { appId } = ctx.params;
  const {
    user: { organizations },
  } = ctx.state;
  const { App } = db.models;
  const { app, style, sharedStyle, yaml } = ctx.request.body;

  let result;

  try {
    result = {
      definition: app.definition,
      style: validateStyle(style && style.contents),
      sharedStyle: validateStyle(sharedStyle && sharedStyle.contents),
      domain: app.domain,
      path: app.path || normalize(app.definition.name),
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
      if (!isEqual(appFromYaml, app.definition)) {
        throw Boom.badRequest('Provided YAML was not equal to definition when converted.');
      }
    } else {
      result.yaml = jsYaml.safeDump(app.definition);
    }

    await checkBlocks(app, db);

    const dbApp = await App.findOne({ where: { id: appId } });

    if (!dbApp) {
      throw Boom.notFound('App not found');
    }

    if (!organizations.some(organization => organization.id === app.OrganizationId)) {
      throw Boom.forbidden("User does not belong in this App's organization.");
    }

    await dbApp.update(result, { where: { id: appId } });

    ctx.body = getAppFromRecord({ ...app.dataValues, ...result });
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
  const { app, style, sharedStyle, yaml, icon } = ctx.request.body;

  let result;

  try {
    result = {};

    if (app) {
      if (app.definition) {
        result.definition = app.definition;
        await checkBlocks(app, db);
      }

      if (app.path) {
        result.path = app.path;
      }

      if (app.private !== undefined) {
        result.private = app.private;
      }

      if (app.domain != null) {
        result.domain = app.domain;
      }
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
      if (!isEqual(appFromYaml, app.definition)) {
        throw Boom.badRequest('Provided YAML was not equal to definition when converted.');
      }

      result.yaml = yaml.contents;
    } else if (app && app.definition) {
      result.yaml = jsYaml.safeDump(app.definition);
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
