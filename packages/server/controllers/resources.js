import { SchemaValidationError, validate } from '@appsemble/utils';
import Boom from '@hapi/boom';
import parseOData from '@wesselkuipers/odata-sequelize';
import crypto from 'crypto';

function verifyResourceDefinition(app, resourceType) {
  if (!app) {
    throw Boom.notFound('App not found');
  }

  if (!app.definition.resources) {
    throw Boom.notFound('App does not have any resources defined');
  }

  if (!app.definition.resources[resourceType]) {
    throw Boom.notFound(`App does not have resources called ${resourceType}`);
  }

  if (!app.definition.resources[resourceType].schema) {
    throw Boom.notFound(`App does not have a schema for resources called ${resourceType}`);
  }

  const resource = app.definition.resources[resourceType];
  const referenceProperties = {};

  if (resource.references) {
    Object.entries(resource.references).forEach(([field, resourceName]) => {
      if (!app.definition.resources[resourceName]) {
        throw Boom.notFound(
          `Resource ${resourceName} referenced by ${resourceType} does not exist.`,
        );
      }

      referenceProperties[field] = app.definition.resources[resourceName].id || {};
    });
  }

  return {
    ...resource.schema,
    properties: {
      ...resource.schema.properties,
      ...referenceProperties,
    },
  };
}

function generateQuery(ctx, { updatedHash, createdHash }) {
  if (ctx.querystring) {
    try {
      return parseOData(
        decodeURIComponent(
          ctx.querystring
            .replace(/\+/g, '%20')
            .replace(/\$updated/g, updatedHash)
            .replace(/\$created/g, createdHash),
        ),
        ctx.db,
      );
    } catch (e) {
      return {};
    }
  }

  return {};
}

/**
 * Iterates through all keys in an object and preprends matched keys with ´data.´
 * @param {Object} object Object to iterate through
 * @param {string[]} keys Keys to match with
 */
const deepRename = (object, keys, { updatedHash, createdHash }) => {
  if (!object) {
    return {};
  }

  const isArray = Array.isArray(object);
  const obj = isArray ? [...object] : { ...object };

  const entries = [...Object.keys(obj), ...Object.getOwnPropertySymbols(obj)];
  entries.forEach(key => {
    const value = obj[key];

    if (isArray) {
      if (keys.some(k => k === value)) {
        obj[key] = `data.${value}`;
      }
    } else if (keys.some(k => k === key)) {
      obj[`data.${key}`] = value;
      delete obj[key];
    }

    if (value === updatedHash) {
      obj[key] = 'updated';
    } else if (value === createdHash) {
      obj[key] = 'created';
    }

    if (key === updatedHash) {
      obj.updated = obj[key];
      delete obj[key];
    } else if (key === createdHash) {
      obj.created = obj[key];
      delete obj[key];
    }

    if (!!obj[key] && (obj[key] instanceof Object || Array.isArray(obj[key]))) {
      obj[key] = deepRename(obj[key], keys, { updatedHash, createdHash });
    }
  });

  return obj;
};

export async function queryResources(ctx) {
  const updatedHash = `updated${crypto.randomBytes(5).toString('hex')}`;
  const createdHash = `created${crypto.randomBytes(5).toString('hex')}`;

  const query = generateQuery(ctx, { updatedHash, createdHash });
  const { appId, resourceType } = ctx.params;
  const { App } = ctx.db.models;

  const app = await App.findByPk(appId);
  const { properties } = verifyResourceDefinition(app, resourceType);

  const keys = Object.keys(properties);
  // the data is stored in the ´data´ column as json
  const renamedQuery = deepRename(query, keys, { updatedHash, createdHash });

  try {
    const resources = await app.getResources({
      ...renamedQuery,
      where: { ...renamedQuery.where, type: resourceType },
    });

    ctx.body = resources.map(resource => ({
      id: resource.id,
      ...resource.data,
      $created: resource.created,
      $updated: resource.updated,
    }));
  } catch (e) {
    if (query) {
      throw Boom.badRequest('Unable to process this query');
    }

    throw e;
  }
}

export async function getResourceById(ctx) {
  const { appId, resourceType, resourceId } = ctx.params;
  const { App } = ctx.db.models;

  const app = await App.findByPk(appId);
  verifyResourceDefinition(app, resourceType);

  const [resource] = await app.getResources({
    where: { id: resourceId, type: resourceType },
    raw: true,
  });

  if (!resource) {
    throw Boom.notFound('Resource not found');
  }

  ctx.body = {
    id: resource.id,
    ...resource.data,
    $created: resource.created,
    $updated: resource.updated,
  };
}

export async function createResource(ctx) {
  const { appId, resourceType } = ctx.params;
  const { App } = ctx.db.models;
  const { user } = ctx.state;

  const app = await App.findByPk(appId);
  verifyResourceDefinition(app, resourceType);

  const resource = ctx.request.body;
  const { schema } = app.definition.resources[resourceType];

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

  const { id, created, updated } = await app.createResource({
    type: resourceType,
    data: resource,
    UserId: user && user.id,
  });

  ctx.body = { id, ...resource, $created: created, $updated: updated };
  ctx.status = 201;
}

export async function updateResource(ctx) {
  const { appId, resourceType, resourceId } = ctx.params;
  const { App, Resource } = ctx.db.models;
  // XXX: Uncomment this when Koas allows for parsing tokens despite the endpoint not requiring one.
  // const { user } = ctx.state;

  const app = await App.findByPk(appId);

  // XXX: Restore this once security is properly implemented.
  // if (!user.organizations.some(organization => organization.id === app.OrganizationId)) {
  //   throw Boom.forbidden('User does not belong in this organization.');
  // }

  verifyResourceDefinition(app, resourceType);
  let resource = await Resource.findOne({
    where: { id: resourceId, type: resourceType, AppId: appId },
  });

  if (!resource) {
    throw Boom.notFound('Resource not found');
  }

  const updatedResource = ctx.request.body;
  const { schema } = app.definition.resources[resourceType];

  try {
    await validate(schema, updatedResource);
  } catch (err) {
    if (!(err instanceof SchemaValidationError)) {
      throw err;
    }

    const boom = Boom.badRequest(err.message);
    boom.output.payload.data = err.data;
    throw boom;
  }

  resource.changed('updatedAt', true);
  resource = await resource.update(
    { data: updatedResource },
    { where: { id: resourceId, type: resourceType, AppId: appId } },
  );

  await resource.reload();

  ctx.body = {
    id: resourceId,
    ...resource.get('data', { plain: true }),
    $created: resource.created,
    $updated: resource.updated,
  };
}

export async function deleteResource(ctx) {
  const { appId, resourceType, resourceId } = ctx.params;
  const { App, Resource } = ctx.db.models;
  const { user } = ctx.state;

  const app = await App.findByPk(appId);

  if (!user.organizations.some(organization => organization.id === app.OrganizationId)) {
    throw Boom.forbidden('User does not belong in this organization.');
  }

  verifyResourceDefinition(app, resourceType);
  const resource = await Resource.findOne({
    where: { id: resourceId, type: resourceType, AppId: appId },
  });

  if (!resource) {
    throw Boom.notFound('Resource not found');
  }

  await resource.destroy();
  ctx.status = 204;
}
