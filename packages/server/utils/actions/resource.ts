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
  addResourceEtag,
  deleteS3Files,
  getCompressedFileMeta,
  getRemapperContext,
  getResourceDefinition,
  logger,
  processResourceBody,
  type QueryParams,
  uploadAssets,
  serializeServerResource,
} from '@appsemble/node-utils';
import { Op } from 'sequelize';

import { type ServerActionParameters } from './index.js';
import { getAppDB } from '../../models/index.js';
import { type ResourceGlobal } from '../../models/apps/Resource.js';
import { lockResourceWithIfMatch } from '../optimisticResourceLock.js';
import {
  parseQuery,
  processHooks,
  processReferenceHooks,
  processReferenceTriggers,
} from '../resource.js';

export const resourceCleanup = {
  async deleteDereferencedS3Assets(appId: number, deletedAssetIds: string[]): Promise<void> {
    try {
      await deleteS3Files(`app-${appId}`, deletedAssetIds);
    } catch (error) {
      logger.error(error);
    }
  },
};

function resolveImplicitIfMatch(actionData: unknown): string | undefined {
  if (actionData && typeof actionData === 'object' && !Array.isArray(actionData)) {
    const etag = (actionData as Record<string, unknown>).$etag;
    if (typeof etag === 'string') {
      return etag;
    }
  }
  return undefined;
}

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

  // Support action.id remapper (like client-side) or fallback to body.id
  // @ts-expect-error 2345 argument of type is not assignable to parameter of type
  const resourceId = action.id ? remap(action.id, data, internalContext) : body?.id;
  if (!resourceId) {
    throw new Error('Missing id');
  }
  body.id = resourceId;

  const { view } = action;
  const resourceDefinition = getResourceDefinition(app.definition, action.resource, context, view);

  const resource = await Resource.findOne({
    include: [
      { association: 'Author', attributes: ['id', 'name'], required: false },
      { association: 'Editor', attributes: ['id', 'name'], required: false },
    ],
    where: {
      id: resourceId,
      type: action.resource,
      expires: { [Op.or]: [{ [Op.gt]: new Date() }, null] },
    },
  });

  if (!resource) {
    throw new Error('Resource not found');
  }

  if (!view) {
    return addResourceEtag(resource.toJSON());
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

  // View responses do not carry an $etag: the projection is not the raw
  // resource representation, so an ETag here would either share with the raw
  // resource (RFC 7232 violation) or be meaningless for If-Match round-trips.
  return remap(resourceDefinition.views?.[view].remap ?? null, resource.toJSON(), remapperContext);
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
    return mappedResources.map((resource) => addResourceEtag(resource));
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

  // View responses omit `$etag`; see the same reasoning in `get`.
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

  const body = action.body
    ? ((remap(action.body ?? null, data, internalContext!) ?? data) as
        | Record<string, unknown>
        | Record<string, unknown>[])
    : (data as any);

  const definition = getResourceDefinition(app.definition, action.resource, context);

  const appAssets = await getAppAssets({ context, app: app.toJSON() });

  const [processedBody, preparedAssets] = await processResourceBody(
    context,
    definition,
    undefined,
    undefined,
    appAssets.map((asset) => ({ id: asset.id, name: asset.name })),
    false,
    serializeServerResource(body),
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

  return Array.isArray(processedBody) ? createdResources : addResourceEtag(createdResources[0]);
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
  const body = action.body
    ? ((remap(action.body ?? null, actionData, internalContext!) ?? actionData) as Record<
        string,
        unknown
      >)
    : (actionData as any);

  // Support action.id remapper (like client-side) or fallback to body.id
  // @ts-expect-error 2345 argument of type is not assignable to parameter of type
  const resourceId = action.id ? remap(action.id, actionData, internalContext) : body?.id;
  if (!resourceId) {
    throw new Error('Missing id');
  }
  body.id = resourceId;

  const ifMatch = resolveImplicitIfMatch(actionData);

  const definition = getResourceDefinition(app.definition, action.resource, context);

  const resource = await Resource.findOne({
    where: {
      id: resourceId,
      type: action.resource,
    },
    include: [{ association: 'Author', attributes: ['id', 'name'], required: false }],
  });

  if (!resource) {
    throw new Error('Resource not found');
  }
  const { getAppAssets } = options;
  const appAssets = await getAppAssets({ context, app: app.toJSON() });

  const [updatedResource, preparedAssets, deletedAssetIds] = await processResourceBody(
    context,
    definition,
    appAssets.filter((asset) => asset.resourceId === resource.id).map((asset) => asset.id),
    resource.expires,
    appAssets.map((asset) => ({ id: asset.id, name: asset.name })),
    false,
    serializeServerResource(body),
  );

  const {
    $clonable: clonable,
    $expires: expires,
    // Exclude id from body
    id,
    ...data
  } = updatedResource as Record<string, unknown>;

  const shouldDeleteDereferencedAssets = !definition.history && deletedAssetIds.length > 0;
  let uploadedAssetIds: string[] = [];

  let updatedResourceModel: ResourceGlobal | undefined;
  try {
    updatedResourceModel = await sequelize.transaction(async (transaction) => {
      const lockedResource = await lockResourceWithIfMatch({
        context,
        transaction,
        Resource,
        where: { id: resourceId, type: action.resource },
        ifMatch,
        resourceType: action.resource,
        resourceId,
      });

      if (preparedAssets.length) {
        await uploadAssets(app.id, preparedAssets);
        uploadedAssetIds = preparedAssets.map((asset) => asset.id);
      }

      const oldData = lockedResource.data;
      const previousEditorId = lockedResource.EditorId;
      const promises: Promise<unknown>[] = [
        lockedResource.update({ data, clonable, expires }, { transaction }),
      ];

      if (preparedAssets.length) {
        promises.push(
          Asset.bulkCreate(
            preparedAssets.map((asset) => ({
              ...asset,
              ...getCompressedFileMeta(asset),
              ResourceId: lockedResource.id,
            })),
            { logging: false, transaction },
          ),
        );
      }

      if (definition.history) {
        promises.push(
          ResourceVersion.create(
            {
              ResourceId: lockedResource.id,
              AppMemberId: previousEditorId,
              data: definition.history === true || definition.history.data ? oldData : undefined,
            },
            { transaction },
          ),
        );
      } else if (shouldDeleteDereferencedAssets) {
        promises.push(Asset.destroy({ where: { id: deletedAssetIds }, transaction }));
      }

      await Promise.all(promises);

      return lockedResource.reload({ include: [{ association: 'Editor' }], transaction });
    });
  } catch (error) {
    if (uploadedAssetIds.length) {
      await deleteS3Files(`app-${app.id}`, uploadedAssetIds);
    }
    throw error;
  }

  if (shouldDeleteDereferencedAssets) {
    await resourceCleanup.deleteDereferencedS3Assets(app.id, deletedAssetIds);
  }

  processReferenceHooks(app, updatedResourceModel!, 'update', options, context);
  processHooks(app, updatedResourceModel!, 'update', options, context);

  return addResourceEtag(updatedResourceModel!.toJSON());
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
  const nestedActionData =
    actionData && typeof actionData === 'object' && !Array.isArray(actionData)
      ? (actionData as Record<string, unknown>)
      : undefined;
  const usesNestedBody =
    !action.body &&
    nestedActionData &&
    nestedActionData.resource &&
    typeof nestedActionData.resource === 'object' &&
    !Array.isArray(nestedActionData.resource) &&
    ('id' in nestedActionData || action.id);
  const body = action.body
    ? ((remap(action.body ?? null, actionData, internalContext!) ?? actionData) as Record<
        string,
        unknown
      >)
    : ((usesNestedBody ? nestedActionData.resource : actionData) as any);

  // Support action.id remapper (like client-side) or fallback to body.id
  // @ts-expect-error 2345 argument of type is not assignable to parameter of type
  const remappedResourceId = action.id ? remap(action.id, actionData, internalContext) : undefined;
  const resourceId = remappedResourceId ?? body?.id ?? nestedActionData?.id;
  if (!resourceId) {
    throw new Error('Missing id');
  }
  // Ensure id is available in body for downstream processing
  body.id = resourceId;

  const ifMatch = resolveImplicitIfMatch(actionData);

  const definition = getResourceDefinition(app.definition, action.resource, context);

  const resource = await Resource.findOne({
    where: { id: resourceId, type: action.resource },
    include: [{ association: 'Author', attributes: ['id', 'name'], required: false }],
  });

  if (!resource) {
    throw new Error('Resource not found');
  }

  const { getAppAssets } = options;
  const appAssets = await getAppAssets({ context, app: app.toJSON() });

  const [patchedResource, preparedAssets, deletedAssetIds] = await processResourceBody(
    context,
    definition,
    appAssets.filter((asset) => asset.resourceId === resource.id).map((asset) => asset.id),
    resource.expires,
    appAssets.map((asset) => ({ id: asset.id, name: asset.name })),
    true,
    serializeServerResource(body),
  );

  const {
    $clonable: clonable,
    $expires: expires,
    // Exclude id from body
    id,
    ...data
  } = patchedResource as Record<string, unknown>;

  const shouldDeleteDereferencedAssets = !definition.history && deletedAssetIds.length > 0;
  let uploadedAssetIds: string[] = [];

  let patchedResourceModel: ResourceGlobal | undefined;
  try {
    patchedResourceModel = await sequelize.transaction(async (transaction) => {
      const lockedResource = await lockResourceWithIfMatch({
        context,
        transaction,
        Resource,
        where: { id: resourceId, type: action.resource },
        ifMatch,
        resourceType: action.resource,
        resourceId,
      });

      if (preparedAssets.length) {
        await uploadAssets(app.id, preparedAssets);
        uploadedAssetIds = preparedAssets.map((asset) => asset.id);
      }

      const oldData = lockedResource.data;
      const patchedData = { ...oldData, ...data };
      const previousEditorId = lockedResource.EditorId;
      const promises: Promise<unknown>[] = [
        lockedResource.update({ data: patchedData, clonable, expires }, { transaction }),
      ];

      if (preparedAssets.length) {
        promises.push(
          Asset.bulkCreate(
            preparedAssets.map((asset) => ({
              ...asset,
              ...getCompressedFileMeta(asset),
              ResourceId: lockedResource.id,
            })),
            { logging: false, transaction },
          ),
        );
      }

      if (definition.history) {
        promises.push(
          ResourceVersion.create(
            {
              ResourceId: lockedResource.id,
              AppMemberId: previousEditorId,
              data: definition.history === true || definition.history.data ? oldData : undefined,
            },
            { transaction },
          ),
        );
      } else if (shouldDeleteDereferencedAssets) {
        promises.push(Asset.destroy({ where: { id: deletedAssetIds }, transaction }));
      }

      await Promise.all(promises);

      return lockedResource.reload({ include: [{ association: 'Editor' }], transaction });
    });
  } catch (error) {
    if (uploadedAssetIds.length) {
      await deleteS3Files(`app-${app.id}`, uploadedAssetIds);
    }
    throw error;
  }

  if (shouldDeleteDereferencedAssets) {
    await resourceCleanup.deleteDereferencedS3Assets(app.id, deletedAssetIds);
  }

  return addResourceEtag(patchedResourceModel!.toJSON());
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

  // Support action.id remapper (like client-side) or fallback to body.id
  // @ts-expect-error 2345 argument of type is not assignable to parameter of type
  const resourceId = action.id ? remap(action.id, data, internalContext) : body?.id;
  if (!resourceId) {
    throw new Error('Missing id');
  }
  body.id = resourceId;

  const resource = await Resource.findOne({
    where: { id: resourceId, type: action.resource },
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
