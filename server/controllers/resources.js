import Boom from 'boom';
import validate, { SchemaValidationError } from '@appsemble/utils/validate';
import parseOData from 'odata-sequelize';

function verifyResourceDefinition(app, resourceType) {
  if (!app) {
    throw Boom.notFound('App not found');
  }

  if (!app.definition.definitions) {
    throw Boom.notFound('App does not have any resources defined');
  }

  if (!app.definition.definitions[resourceType]) {
    throw Boom.notFound(`App does not have resources called ${resourceType}`);
  }

  return app.definition.definitions[resourceType];
}

function generateQuery(ctx) {
  if (ctx.querystring) {
    try {
      return parseOData(decodeURIComponent(ctx.querystring), ctx.db);
    } catch (e) {
      return {};
    }
  }

  return {};
}

const deepRename = (object, keys) => {
  if (!object) {
    return {};
  }

  const obj = Array.isArray(object) ? [...object] : { ...object };
  Object.entries(obj).forEach(([key, value]) => {
    if (keys.some(k => k === key)) {
      obj[`data.${key}`] = value;
      delete obj[key];
    }

    if (!!object[key] && (object[key] instanceof Object || Array.isArray(object[key]))) {
      obj[key] = deepRename(obj[key], keys);
    }
  });

  return obj;
};

export async function getAll(ctx) {
  const query = generateQuery(ctx);
  console.log(query);
  const { appId, resourceType } = ctx.params;
  const { App } = ctx.db.models;

  const app = await App.findByPk(appId);
  const keys = Object.keys(verifyResourceDefinition(app, resourceType).properties);
  const renamedQuery = deepRename(query, keys);
  console.log(renamedQuery);

  try {
    const resources = await app.getResources({
      ...renamedQuery,
      type: resourceType,
    });

    ctx.body = resources.map(resource => ({ id: resource.id, ...resource.data }));
  } catch (e) {
    if (query) {
      throw Boom.badRequest('Unable to process this query');
    }

    throw e;
  }
}

export async function getOne(ctx) {
  const { appId, resourceType, resourceId } = ctx.params;
  const { App } = ctx.db.models;

  const app = await App.findByPk(appId);
  verifyResourceDefinition(app, resourceType);

  const [resource] = await app.getResources({ where: { id: resourceId }, raw: true });

  if (!resource) {
    throw Boom.notFound('Resource not found');
  }

  ctx.body = { id: resource.id, ...resource.data };
}

export async function create(ctx) {
  const { appId, resourceType } = ctx.params;
  const { App } = ctx.db.models;

  const app = await App.findByPk(appId);
  verifyResourceDefinition(app, resourceType);

  const resource = ctx.request.body;
  const schema = app.definition.definitions[resourceType];

  try {
    await validate(schema, resource);
  } catch (err) {
    if (!(err instanceof SchemaValidationError)) {
      throw err;
    }

    const boom = Boom.badRequest(err.message);
    boom.output.payload.data = err.data;
    throw boom;
  }

  const { id } = await app.createResource({ type: resourceType, data: resource });

  ctx.body = { id, ...resource };
  ctx.status = 201;
}
