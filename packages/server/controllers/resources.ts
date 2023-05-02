import {
  extractResourceBody,
  getResourceDefinition,
  processResourceBody,
} from '@appsemble/node-utils';
import {
  createCountResources,
  createCreateResource,
  createDeleteResource,
  createGetResourceById,
  createQueryResources,
  createUpdateResource,
} from '@appsemble/node-utils/server/controllers/resources.js';
import { type Resource as ResourceType } from '@appsemble/types';
import { badRequest, notFound } from '@hapi/boom';
import { type Context } from 'koa';

import {
  App,
  AppMember,
  AppSubscription,
  Asset,
  Organization,
  Resource,
  ResourceSubscription,
  ResourceVersion,
  transactional,
} from '../models/index.js';
import { options } from '../options/options.js';
import { processHooks, processReferenceHooks } from '../utils/resource.js';

export const queryResources = createQueryResources(options);

export const countResources = createCountResources(options);

export const getResourceById = createGetResourceById(options);

export async function getResourceTypeSubscription(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, resourceType },
    query: { endpoint },
  } = ctx;
  const app = await App.findByPk(appId, {
    attributes: ['definition'],
    include: [
      {
        model: Resource,
        attributes: ['id'],
        where: { type: resourceType },
        required: false,
      },
      {
        attributes: ['id', 'UserId'],
        model: AppSubscription,
        include: [
          {
            model: ResourceSubscription,
            where: { type: resourceType },
            required: false,
          },
        ],
        required: false,
        where: { endpoint },
      },
    ],
  });
  getResourceDefinition(app.toJSON(), resourceType);

  if (!app.Resources.length) {
    throw notFound('Resource not found.');
  }

  if (!app.AppSubscriptions.length) {
    throw notFound('User is not subscribed to this app.');
  }

  const [appSubscription] = app.AppSubscriptions;

  if (!appSubscription) {
    throw notFound('Subscription not found');
  }

  const result: any = { create: false, update: false, delete: false };
  for (const { ResourceId, action } of appSubscription.ResourceSubscriptions) {
    if (ResourceId) {
      if (!result.subscriptions) {
        result.subscriptions = {};
      }

      if (!result.subscriptions[ResourceId]) {
        result.subscriptions[ResourceId] = { update: false, delete: false };
      }

      result.subscriptions[ResourceId][action] = true;
    } else {
      result[action] = true;
    }
  }

  ctx.body = result;
}

export async function getResourceSubscription(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, resourceId, resourceType },
    query: { endpoint },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['definition'],
    include: [
      {
        model: Resource,
        attributes: ['id'],
        where: { id: resourceId },
        required: false,
      },
      {
        attributes: ['id', 'UserId'],
        model: AppSubscription,
        include: [
          {
            model: ResourceSubscription,
            where: { type: resourceType, ResourceId: resourceId },
            required: false,
          },
        ],
        required: false,
        where: { endpoint },
      },
    ],
  });
  getResourceDefinition(app.toJSON(), resourceType);

  if (!app.Resources.length) {
    throw notFound('Resource not found.');
  }

  const subscriptions = app.AppSubscriptions?.[0]?.ResourceSubscriptions ?? [];
  const result: any = { id: resourceId, update: false, delete: false };

  for (const { action } of subscriptions) {
    result[action] = true;
  }

  ctx.body = result;
}

export const createResource = createCreateResource(options);

export async function updateResources(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, resourceType },
    user,
  } = ctx;
  const { verifyPermission } = options;

  const action = 'update';

  const app = await App.findByPk(appId, {
    attributes: ['id', 'definition', 'OrganizationId', 'vapidPrivateKey', 'vapidPublicKey'],
    include: user
      ? [
          { model: Organization, attributes: ['id'] },
          {
            model: AppMember,
            attributes: ['role', 'UserId'],
            required: false,
            where: { UserId: user.id },
          },
        ]
      : [],
  });

  const definition = getResourceDefinition(app.toJSON(), resourceType);
  const userQuery = await verifyPermission({
    context: ctx,
    app: app.toJSON(),
    resourceType,
    action,
    options,
  });
  const resourceList = extractResourceBody(ctx)[0] as ResourceType[];

  if (!resourceList.length) {
    ctx.body = [];
    return;
  }

  if (resourceList.some((r) => !r.id)) {
    throw badRequest(
      'List of resources contained a resource without an ID.',
      resourceList.filter((r) => !r.id),
    );
  }

  const existingResources = await Resource.findAll({
    where: {
      id: resourceList.map((r) => Number(r.id)),
      type: resourceType,
      AppId: appId,
      ...userQuery,
    },
    include: [
      { association: 'Author', attributes: ['id', 'name'], required: false },
      { association: 'Editor', attributes: ['id', 'name'], required: false },
      { model: Asset, attributes: ['id'], required: false },
    ],
  });

  const [resources, preparedAssets, unusedAssetIds] = processResourceBody(
    ctx,
    definition,
    existingResources.flatMap((r) => r.Assets.map((a) => a.id)),
  );
  const processedResources = resources as ResourceType[];

  if (existingResources.length !== processedResources.length) {
    const ids = new Set(existingResources.map((r) => r.id));
    throw badRequest(
      'One or more resources could not be found.',
      processedResources.filter((r) => !ids.has(r.id)),
    );
  }

  let updatedResources: Resource[];
  await transactional(async (transaction) => {
    updatedResources = await Promise.all(
      processedResources.map(async ({ $author, $created, $editor, $updated, id, ...data }) => {
        const [, [resource]] = await Resource.update(
          {
            data,
            EditorId: user?.id,
          },
          { where: { id }, transaction, returning: true },
        );
        return resource;
      }),
    );

    if (definition.history) {
      const historyDefinition = definition.history;
      await ResourceVersion.bulkCreate(
        existingResources.map((resource) => ({
          ResourceId: resource.id,
          UserId: resource.EditorId,
          data: historyDefinition === true || historyDefinition.data ? resource.data : undefined,
        })),
      );
    } else if (unusedAssetIds.length) {
      await Asset.destroy({
        where: {
          id: unusedAssetIds,
        },
        transaction,
      });
    }

    if (preparedAssets.length) {
      await Asset.bulkCreate(
        preparedAssets.map((asset) => {
          const index = processedResources.indexOf(asset.resource as ResourceType);
          const { id: ResourceId } = processedResources[index];
          return {
            ...asset,
            AppId: app.id,
            ResourceId,
            UserId: user?.id,
          };
        }),
        { logging: false, transaction },
      );
    }
  });

  ctx.body = updatedResources;

  for (const resource of updatedResources) {
    processReferenceHooks(user, app, resource, action, options, ctx);
    processHooks(user, app, resource, action, options, ctx);
  }
}

export const updateResource = createUpdateResource(options);

export async function patchResource(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, resourceId, resourceType },
    user,
  } = ctx;
  const { verifyPermission } = options;

  const action = 'patch';

  const app = await App.findByPk(appId, {
    attributes: ['id', 'definition', 'OrganizationId'],
    include: user
      ? [
          { model: Organization, attributes: ['id'] },
          {
            model: AppMember,
            attributes: ['role', 'UserId'],
            required: false,
            where: { UserId: user.id },
          },
        ]
      : [],
  });

  const definition = getResourceDefinition(app.toJSON(), resourceType);
  const userQuery = await verifyPermission({
    context: ctx,
    app: app.toJSON(),
    resourceType,
    action,
    options,
  });

  const resource = await Resource.findOne({
    where: { id: resourceId, type: resourceType, AppId: appId, ...userQuery },
    include: [
      { association: 'Author', attributes: ['id', 'name'], required: false },
      { model: Asset, attributes: ['id'], required: false },
    ],
  });

  if (!resource) {
    throw notFound('Resource not found');
  }

  const [updatedResource, preparedAssets, deletedAssetIds] = processResourceBody(
    ctx,
    definition,
    resource.Assets.map((asset) => asset.id),
    resource.expires,
  );
  const {
    $clonable: clonable,
    $expires: expires,
    ...patchData
  } = updatedResource as Record<string, unknown>;

  await transactional((transaction) => {
    const oldData = resource.data;
    const data = { ...oldData, ...patchData };
    const previousEditorId = resource.EditorId;
    const promises: Promise<unknown>[] = [
      resource.update({ data, clonable, expires, EditorId: user?.id }, { transaction }),
    ];

    if (preparedAssets.length) {
      promises.push(
        Asset.bulkCreate(
          preparedAssets.map((asset) => ({
            ...asset,
            AppId: app.id,
            ResourceId: resource.id,
            UserId: user?.id,
          })),
          { logging: false, transaction },
        ),
      );
    }

    if (definition.history) {
      promises.push(
        ResourceVersion.create(
          {
            ResourceId: resourceId,
            UserId: previousEditorId,
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

  ctx.body = resource;
}

export const deleteResource = createDeleteResource(options);

export async function deleteResources(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, resourceType },
    request: { body },
    user,
  } = ctx;
  const { verifyPermission } = options;

  const action = 'delete';

  const app = await App.findByPk(appId, {
    attributes: ['id', 'definition', 'OrganizationId', 'vapidPrivateKey', 'vapidPublicKey'],
    include: user
      ? [
          { model: Organization, attributes: ['id'] },
          {
            model: AppMember,
            attributes: ['role', 'UserId'],
            required: false,
            where: { UserId: user.id },
          },
        ]
      : [],
  });

  getResourceDefinition(app.toJSON(), resourceType);
  const userQuery = await verifyPermission({
    context: ctx,
    app: app.toJSON(),
    resourceType,
    action,
    options,
  });

  let deletedAmount = 0;
  while (deletedAmount < body.length) {
    for (const resource of await Resource.findAll({
      where: {
        id: body.slice(deletedAmount, deletedAmount + 100),
        type: resourceType,
        AppId: appId,
        ...userQuery,
      },
      limit: 100,
    })) {
      await resource.destroy();
      processReferenceHooks(user, app, resource, action, options, ctx);
      processHooks(user, app, resource, action, options, ctx);
    }
    deletedAmount += 100;
  }

  ctx.status = 204;
}
