import Boom from 'boom';

import validate, { SchemaValidationError } from '@appsemble/utils/validate';

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
}

export async function getAll(ctx) {
  const { appId, resourceType } = ctx.params;
  const { App } = ctx.state.db;

  const app = await App.findById(appId);
  verifyResourceDefinition(app, resourceType);

  const resources = await app.getResources({ type: resourceType });
  ctx.body = resources.map(resource => ({ id: resource.id, ...resource.data }));
}

export async function getOne(ctx) {
  const { appId, resourceType, resourceId } = ctx.params;
  const { App } = ctx.state.db;

  const app = await App.findById(appId);
  verifyResourceDefinition(app, resourceType);

  const [resource] = await app.getResources({ where: { id: resourceId } });

  if (!resource) {
    throw Boom.notFound('Resource not found');
  }

  ctx.body = { id: resource.id, ...resource.data };
}

export async function create(ctx) {
  const { appId, resourceType } = ctx.params;
  const { App } = ctx.state.db;

  const app = await App.findById(appId);
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
