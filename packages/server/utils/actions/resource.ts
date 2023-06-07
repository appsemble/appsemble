import {
  type ResourceCreateActionDefinition,
  type ResourceDeleteActionDefinition,
  type ResourceGetActionDefinition,
  type ResourcePatchActionDefinition,
  type ResourceQueryActionDefinition,
  type ResourceUpdateActionDefinition,
} from '@appsemble/types';
import { defaultLocale, remap } from '@appsemble/utils';
import { type QueryParams } from 'koas-parameters';
import { Op } from 'sequelize';

import { type ServerActionParameters } from './index.js';
import { AppMember, Asset, Resource, ResourceVersion, transactional } from '../../models/index.js';
import { getRemapperContext } from '../app.js';
import {
  getResourceDefinition,
  parseQuery,
  processHooks,
  processReferenceHooks,
  validate,
} from '../resource.js';

export async function get({
  action,
  app,
  data,
  internalContext,
  user,
}: ServerActionParameters<ResourceGetActionDefinition>): Promise<unknown> {
  const body = (remap(action.body, data, internalContext) ?? data) as Record<string, unknown>;

  if (!body?.id) {
    throw new Error('Missing id');
  }

  const { view } = action;
  const resourceDefinition = getResourceDefinition(app, action.resource, view);

  const resource = await Resource.findOne({
    include: [
      { association: 'Author', attributes: ['id', 'name'], required: false },
      { association: 'Editor', attributes: ['id', 'name'], required: false },
    ],
    where: {
      id: body.id,
      type: action.resource,
      AppId: app.id,
      expires: { [Op.or]: [{ [Op.gt]: new Date() }, null] },
    },
  });

  if (!resource) {
    throw new Error('Resource not found');
  }

  const parsedResource = resource.toJSON();

  if (!view) {
    return parsedResource;
  }

  const appMember =
    user && (await AppMember.findOne({ where: { AppId: app.id, UserId: user.id } }));

  const context = await getRemapperContext(
    app,
    app.definition.defaultLanguage || defaultLocale,
    appMember && {
      sub: user.id,
      name: appMember.name,
      email: appMember.email,
      email_verified: appMember.emailVerified,
      zoneinfo: user.timezone,
    },
  );
  return remap(resourceDefinition.views[view].remap, parsedResource, context);
}

export async function query({
  action,
  app,
  data,
  internalContext,
  user,
}: ServerActionParameters<ResourceQueryActionDefinition>): Promise<unknown> {
  const { view } = action;
  const queryRemapper = action?.query ?? app.definition.resources[action.resource]?.query?.query;

  const queryParams = remap(queryRemapper, data, internalContext) as QueryParams;

  const parsed = parseQuery(queryParams || {});
  const include = queryParams?.$select?.split(',').map((s) => s.trim());
  const resourceDefinition = getResourceDefinition(app, action.resource, view);

  const resources = await Resource.findAll({
    include: [
      { association: 'Author', attributes: ['id', 'name'], required: false },
      { association: 'Editor', attributes: ['id', 'name'], required: false },
    ],
    order: parsed.order,
    where: {
      [Op.and]: [
        parsed.query,
        {
          type: action.resource,
          AppId: app.id,
          expires: { [Op.or]: [{ [Op.gt]: new Date() }, null] },
        },
      ],
    },
  });

  const mappedResources = resources.map((resource) => resource.toJSON({ include }));

  if (!view) {
    return mappedResources;
  }

  const appMember =
    user && (await AppMember.findOne({ where: { AppId: app.id, UserId: user.id } }));

  const context = await getRemapperContext(
    app,
    app.definition.defaultLanguage || defaultLocale,
    appMember && {
      sub: user.id,
      name: appMember.name,
      email: appMember.email,
      email_verified: appMember.emailVerified,
      zoneinfo: user.timezone,
    },
  );
  return mappedResources.map((resource) =>
    remap(resourceDefinition.views[view].remap, resource, context),
  );
}

export async function create({
  action,
  app,
  data,
  internalContext,
  user,
}: ServerActionParameters<ResourceCreateActionDefinition>): Promise<unknown> {
  const body = (remap(action.body, data, internalContext) ?? data) as
    | Record<string, unknown>
    | Record<string, unknown>[];

  const definition = getResourceDefinition(app, action.resource);
  const resource = validate(body, definition);

  const resources = Array.isArray(resource) ? resource : [resource];
  const createdResources = await Resource.bulkCreate(
    resources.map(({ $expires, ...resourceData }) => ({
      type: action.resource,
      data: resourceData,
      AppId: app.id,
      AuthorId: user?.id,
      expires: $expires,
    })),
  );

  processReferenceHooks(user, app, createdResources[0], 'create');
  processHooks(user, app, createdResources[0], 'create');

  const mappedResources = createdResources.map((r) => r.toJSON());

  return Array.isArray(resource) ? mappedResources : mappedResources[0];
}

export async function update({
  action,
  app,
  data: actionData,
  internalContext,
  user,
}: ServerActionParameters<ResourceUpdateActionDefinition>): Promise<unknown> {
  const body = (remap(action.body, actionData, internalContext) ?? actionData) as Record<
    string,
    unknown
  >;

  if (!body?.id) {
    throw new Error('Missing id');
  }

  const definition = getResourceDefinition(app, action.resource);

  const resource = await Resource.findOne({
    where: {
      id: body.id,
      type: action.resource,
      AppId: app.id,
    },
    include: [{ association: 'Author', attributes: ['id', 'name'], required: false }],
  });

  if (!resource) {
    throw new Error('Resource not found');
  }

  const updatedResource = validate(body, definition, false, resource.expires);

  const {
    $clonable: clonable,
    $expires: expires,
    // Exclude id from body
    id,
    ...data
  } = updatedResource as Record<string, unknown>;

  await transactional((transaction) => {
    const oldData = resource.data;
    const previousEditorId = resource.EditorId;
    const promises: Promise<unknown>[] = [
      resource.update({ data, clonable, expires }, { transaction }),
    ];

    if (definition.history) {
      promises.push(
        ResourceVersion.create(
          {
            ResourceId: resource.id,
            UserId: previousEditorId,
            data: definition.history === true || definition.history.data ? oldData : undefined,
          },
          { transaction },
        ),
      );
    }

    return Promise.all(promises);
  });
  await resource.reload({ include: [{ association: 'Editor' }] });

  processReferenceHooks(user, app, resource, 'update');
  processHooks(user, app, resource, 'update');

  return resource.toJSON();
}

export async function patch({
  action,
  app,
  data: actionData,
  internalContext,
}: ServerActionParameters<ResourcePatchActionDefinition>): Promise<unknown> {
  const body = (remap(action.body, actionData, internalContext) ?? actionData) as Record<
    string,
    unknown
  >;

  if (!body?.id) {
    throw new Error('Missing id');
  }

  const definition = getResourceDefinition(app, action.resource);

  const resource = await Resource.findOne({
    where: {
      id: body.id,
      type: action.resource,
      AppId: app.id,
    },
    include: [{ association: 'Author', attributes: ['id', 'name'], required: false }],
  });

  if (!resource) {
    throw new Error('Resource not found');
  }

  const patchedResource = validate(body, definition, true, resource.expires);

  const {
    $clonable: clonable,
    $expires: expires,
    // Exclude id from body
    id,
    ...data
  } = patchedResource as Record<string, unknown>;

  await transactional((transaction) => {
    const oldData = resource.data;
    const patchedData = { ...oldData, ...data };
    const previousEditorId = resource.EditorId;
    const promises: Promise<unknown>[] = [
      resource.update({ data: patchedData, clonable, expires }, { transaction }),
    ];

    if (definition.history) {
      promises.push(
        ResourceVersion.create(
          {
            ResourceId: resource.id,
            UserId: previousEditorId,
            data: definition.history === true || definition.history.data ? oldData : undefined,
          },
          { transaction },
        ),
      );
    }

    return Promise.all(promises);
  });
  await resource.reload({ include: [{ association: 'Editor' }] });

  return resource.toJSON();
}

export async function remove({
  action,
  app,
  data,
  internalContext,
  user,
}: ServerActionParameters<ResourceDeleteActionDefinition>): Promise<unknown> {
  const body = (remap(action.body, data, internalContext) ?? data) as Record<string, unknown>;

  getResourceDefinition(app, action.resource);

  if (!body?.id) {
    throw new Error('Missing id');
  }

  const resource = await Resource.findOne({
    where: {
      id: body.id,
      type: action.resource,
      AppId: app.id,
    },
    include: [
      {
        model: Asset,
        required: false,
        where: { id: null },
      },
    ],
  });

  if (!resource) {
    throw new Error('Resource not found');
  }

  await resource.destroy();

  processReferenceHooks(user, app, resource, 'delete');
  processHooks(user, app, resource, 'delete');

  // Returning empty string just like in the client-side resource.delete action.
  return '';
}
