import {
  defaultLocale,
  remap,
  type ResourceCreateActionDefinition,
  type ResourceDeleteActionDefinition,
  type ResourceDeleteAllActionDefinition,
  type ResourceDeleteBulkActionDefinition,
  type ResourceGetActionDefinition,
  type ResourcePatchActionDefinition,
  type ResourceQueryActionDefinition,
  type ResourceUpdateActionDefinition,
} from '@appsemble/lang-sdk';
import {
  getCompressedFileMeta,
  getRemapperContext,
  getResourceDefinition,
  processResourceBody,
  type QueryParams,
  serializeServerResource,
  uploadAssets,
} from '@appsemble/node-utils';
import { serializeResource } from '@appsemble/utils';
import { Op } from 'sequelize';

import { type ServerActionParameters } from './index.js';
import { getAppDB } from '../../models/index.js';
import {
  parseQuery,
  processHooks,
  processReferenceHooks,
  processReferenceTriggers,
} from '../resource.js';

export async function get({
  action,
  app,
  context,
  data,
  internalContext,
  options,
}: ServerActionParameters<ResourceGetActionDefinition>): Promise<unknown> {
  const { Resource } = await getAppDB(app.id);
  // @ts-expect-error 2345 argument of type is not assignable to parameter of type
  // (strictNullChecks)
  const body = (remap(action.body ?? null, data, internalContext) ?? data) as Record<
    string,
    unknown
  >;
  if (!body?.id) {
    throw new Error('Missing id');
  }

  const { view } = action;
  const resourceDefinition = getResourceDefinition(app.definition, action.resource, context, view);

  const resource = await Resource.findOne({
    include: [
      { association: 'Author', attributes: ['id', 'name'], required: false },
      { association: 'Editor', attributes: ['id', 'name'], required: false },
    ],
    where: {
      id: body.id,
      type: action.resource,
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

  const remapperContext = await getRemapperContext(
    app.toJSON(),
    app.definition.defaultLanguage || defaultLocale,
    options,
    context,
  );

  Object.assign(remapperContext, {
    history: internalContext?.history ?? [],
  });

  return remap(resourceDefinition.views?.[view].remap ?? null, parsedResource, remapperContext);
}

export async function query({
  action,
  app,
  context,
  data,
  internalContext,
  options,
}: ServerActionParameters<ResourceQueryActionDefinition>): Promise<unknown> {
  const { Resource } = await getAppDB(app.id);
  const { view } = action;
  const queryRemapper = action?.query ?? app.definition.resources?.[action.resource]?.query?.query;

  // @ts-expect-error 2345 argument of type is not assignable to parameter of type
  // (strictNullChecks)
  const queryParams = (remap(queryRemapper ?? null, data, internalContext) || {}) as QueryParams;

  const resourceDefinition = getResourceDefinition(app.definition, action.resource, context, view);

  const parsed = parseQuery({ ...queryParams, resourceDefinition, tableName: 'Resource' });
  const include = queryParams?.$select?.split?.(',').map((s) => s.trim());

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
          expires: { [Op.or]: [{ [Op.gt]: new Date() }, null] },
        },
      ],
    },
  });

  const mappedResources = resources.map((resource) => resource.toJSON({ include }));

  if (!view) {
    return mappedResources;
  }

  const remapperContext = await getRemapperContext(
    app.toJSON(),
    app.definition.defaultLanguage || defaultLocale,
    options,
    context,
  );
  Object.assign(remapperContext, {
    history: internalContext?.history ?? [],
  });

  return mappedResources.map((resource) =>
    remap(resourceDefinition.views?.[view].remap ?? null, resource, remapperContext),
  );
}

export async function create({
  action,
  app,
  context,
  data,
  internalContext,
  options,
}: ServerActionParameters<ResourceCreateActionDefinition>): Promise<unknown> {
  const { createAppResourcesWithAssets, getAppAssets } = options;

  // @ts-expect-error 2345 argument of type is not assignable to parameter of type
  // (strictNullChecks)
  const body = (remap(action.body ?? null, data, internalContext) ?? data) as
    | Record<string, unknown>
    | Record<string, unknown>[];

  const definition = getResourceDefinition(app.definition, action.resource, context);

  const appAssets = await getAppAssets({ context, app: app.toJSON() });

  if ((context.is && context.is('multipart/form-data')) || context.request) {
    Object.assign(context.request, { body: serializeServerResource(body) });
  } else {
    Object.assign(context, { body: serializeResource(body) });
  }

  const [processedBody, preparedAssets] = processResourceBody(
    context,
    definition,
    undefined,
    undefined,
    appAssets.map((asset) => ({ id: asset.id, name: asset.name })),
  );

  const resources = Array.isArray(processedBody) ? processedBody : [processedBody];

  const createdResources = await createAppResourcesWithAssets({
    app: app.toJSON(),
    context,
    resources: resources.map((resource) => ({
      ...resource,
      $seed: false,
      $ephemeral: app.demoMode,
      ...(app.demoMode ? { $clonable: false } : {}),
    })),
    preparedAssets,
    resourceType: action.resource,
    options,
  });

  await uploadAssets(app.id, preparedAssets);

  return Array.isArray(processedBody) ? createdResources : createdResources[0];
}

export async function update({
  action,
  app,
  context,
  data: actionData,
  internalContext,
  options,
}: ServerActionParameters<ResourceUpdateActionDefinition>): Promise<unknown> {
  const { Asset, Resource, ResourceVersion, sequelize } = await getAppDB(app.id);
  // @ts-expect-error 2345 argument of type is not assignable to parameter of type
  // (strictNullChecks)
  const body = (remap(action.body ?? null, actionData, internalContext) ?? actionData) as Record<
    string,
    unknown
  >;

  if (!body?.id) {
    throw new Error('Missing id');
  }

  const definition = getResourceDefinition(app.definition, action.resource, context);

  const resource = await Resource.findOne({
    where: {
      id: body.id,
      type: action.resource,
    },
    include: [{ association: 'Author', attributes: ['id', 'name'], required: false }],
  });

  if (!resource) {
    throw new Error('Resource not found');
  }
  const { getAppAssets } = options;
  const appAssets = await getAppAssets({ context, app: app.toJSON() });

  if ((context.is && context.is('multipart/form-data')) || context.request) {
    Object.assign(context.request, { body: serializeServerResource(body) });
  } else {
    Object.assign(context, { body: serializeResource(body) });
  }

  const [updatedResource, preparedAssets, deletedAssetIds] = processResourceBody(
    context,
    definition,
    appAssets.filter((asset) => asset.resourceId === resource.id).map((asset) => asset.id),
    resource.expires,
    appAssets.map((asset) => ({ id: asset.id, name: asset.name })),
  );

  const {
    $clonable: clonable,
    $expires: expires,
    // Exclude id from body
    id,
    ...data
  } = updatedResource as Record<string, unknown>;

  await sequelize.transaction((transaction) => {
    const oldData = resource.data;
    const previousEditorId = resource.EditorId;
    const promises: Promise<unknown>[] = [
      resource.update({ data, clonable, expires }, { transaction }),
    ];

    if (preparedAssets.length) {
      promises.push(
        Asset.bulkCreate(
          preparedAssets.map((asset) => ({
            ...asset,
            ...getCompressedFileMeta(asset),
            ResourceId: resource.id,
          })),
          { logging: false, transaction },
        ),
        uploadAssets(app.id, preparedAssets),
      );
    }

    if (definition.history) {
      promises.push(
        ResourceVersion.create(
          {
            ResourceId: resource.id,
            AppMemberId: previousEditorId,
            data: definition.history === true || definition.history.data ? oldData : undefined,
          },
          { transaction },
        ),
      );
    } else {
      promises.push(Asset.destroy({ where: { id: deletedAssetIds }, transaction }));
    }

    return Promise.all(promises);
  });
  await resource.reload({ include: [{ association: 'Editor' }] });

  processReferenceHooks(app, resource, 'update', options, context);
  processHooks(app, resource, 'update', options, context);

  return resource.toJSON();
}

export async function patch({
  action,
  app,
  context,
  data: actionData,
  internalContext,
  options,
}: ServerActionParameters<ResourcePatchActionDefinition>): Promise<unknown> {
  const { Asset, Resource, ResourceVersion, sequelize } = await getAppDB(app.id);
  // @ts-expect-error 2345 argument of type is not assignable to parameter of type
  // (strictNullChecks)
  const body = (remap(action.body ?? null, actionData, internalContext) ?? actionData) as Record<
    string,
    unknown
  >;

  if (!body?.id) {
    throw new Error('Missing id');
  }

  const definition = getResourceDefinition(app.definition, action.resource, context);

  const resource = await Resource.findOne({
    where: { id: body.id, type: action.resource },
    include: [{ association: 'Author', attributes: ['id', 'name'], required: false }],
  });

  if (!resource) {
    throw new Error('Resource not found');
  }

  const { getAppAssets } = options;
  const appAssets = await getAppAssets({ context, app: app.toJSON() });

  if ((context.is && context.is('multipart/form-data')) || context.request) {
    Object.assign(context.request, { body: serializeServerResource(body) });
  } else {
    Object.assign(context, { body: serializeResource(body) });
  }

  const [patchedResource, preparedAssets, deletedAssetIds] = processResourceBody(
    context,
    definition,
    appAssets.filter((asset) => asset.resourceId === resource.id).map((asset) => asset.id),
    resource.expires,
    appAssets.map((asset) => ({ id: asset.id, name: asset.name })),
    true,
  );

  const {
    $clonable: clonable,
    $expires: expires,
    // Exclude id from body
    id,
    ...data
  } = patchedResource as Record<string, unknown>;

  await sequelize.transaction((transaction) => {
    const oldData = resource.data;
    const patchedData = { ...oldData, ...data };
    const previousEditorId = resource.EditorId;
    const promises: Promise<unknown>[] = [
      resource.update({ data: patchedData, clonable, expires }, { transaction }),
    ];

    if (preparedAssets.length) {
      promises.push(
        Asset.bulkCreate(
          preparedAssets.map((asset) => ({
            ...asset,
            ...getCompressedFileMeta(asset),
            ResourceId: resource.id,
          })),
          { logging: false, transaction },
        ),
        uploadAssets(app.id, preparedAssets),
      );
    }

    if (definition.history) {
      promises.push(
        ResourceVersion.create(
          {
            ResourceId: resource.id,
            AppMemberId: previousEditorId,
            data: definition.history === true || definition.history.data ? oldData : undefined,
          },
          { transaction },
        ),
      );
    } else {
      promises.push(Asset.destroy({ where: { id: deletedAssetIds }, transaction }));
    }

    return Promise.all(promises);
  });
  await resource.reload({ include: [{ association: 'Editor' }] });

  return resource.toJSON();
}

export async function remove({
  action,
  app,
  context,
  data,
  internalContext,
  options,
}: ServerActionParameters<ResourceDeleteActionDefinition>): Promise<unknown> {
  const { Asset, Resource } = await getAppDB(app.id);
  // @ts-expect-error 2345 argument of type is not assignable to parameter of type
  // (strictNullChecks)
  const body = (remap(action.body ?? null, data, internalContext) ?? data) as Record<
    string,
    unknown
  >;

  getResourceDefinition(app.definition, action.resource, context);

  if (!body?.id) {
    throw new Error('Missing id');
  }

  const resource = await Resource.findOne({
    where: { id: body.id, type: action.resource },
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

  processReferenceHooks(app, resource, 'delete', options, context);
  processHooks(app, resource, 'delete', options, context);

  // Returning empty string just like in the client-side resource.delete action.
  return '';
}

export async function removeAll({
  action,
  app,
  context,
  options,
}: ServerActionParameters<ResourceDeleteAllActionDefinition>): Promise<unknown> {
  const { Asset, Resource } = await getAppDB(app.id);
  getResourceDefinition(app.definition, action.resource, context);

  const resources = await Resource.findAll({
    attributes: ['id'],
    where: { type: action.resource },
  });

  let deletedAmount = 0;
  while (deletedAmount < resources.length) {
    for (const resource of await Resource.findAll({
      where: {
        id: resources.slice(deletedAmount, deletedAmount + 100).map(({ id }) => id),
      },
      include: [
        {
          model: Asset,
          required: false,
          where: { id: null },
        },
      ],
      limit: 100,
    })) {
      processReferenceHooks(app, resource, 'delete', options, context);
      processHooks(app, resource, 'delete', options, context);

      await processReferenceTriggers(app, resource, 'delete', context);

      await resource.destroy();
    }
    deletedAmount += 100;
  }

  // Returning empty string just like in the client-side resource.delete action.
  return '';
}

export async function removeBulk({
  action,
  app,
  context,
  data,
  options,
}: ServerActionParameters<ResourceDeleteBulkActionDefinition>): Promise<unknown> {
  const { Asset, Resource } = await getAppDB(app.id);
  const body = data as number[];

  getResourceDefinition(app.definition, action.resource, context);

  let deletedAmount = 0;
  while (deletedAmount < body.length) {
    for (const resource of await Resource.findAll({
      where: {
        id: body.slice(deletedAmount, deletedAmount + 100),
        type: action.resource,
      },
      include: [
        {
          model: Asset,
          required: false,
          where: { id: null },
        },
      ],
      limit: 100,
    })) {
      processReferenceHooks(app, resource, 'delete', options, context);
      processHooks(app, resource, 'delete', options, context);

      await processReferenceTriggers(app, resource, 'delete', context);

      await resource.destroy();
    }
    deletedAmount += 100;
  }

  // Returning empty string just like in the client-side resource.delete action.
  return '';
}
