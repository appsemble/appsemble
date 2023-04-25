import {
  extractResourceBody,
  getResourceDefinition,
  processResourceBody,
} from '@appsemble/node-utils/resource';
import {
  createCountResources,
  createCreateResource,
  createDeleteResource,
  createGetResourceById,
  createQueryResources,
  createUpdateResource,
} from '@appsemble/node-utils/server/controllers/resources';
import { Resource as ResourceType } from '@appsemble/types';
import { badRequest, notFound } from '@hapi/boom';
import { Context } from 'koa';

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

// Export async function queryResourcesOld(ctx: Context): Promise<void> {
//   const {
//     pathParams: { appId, resourceType },
//     queryParams: { $select, $skip, $top },
//     user,
//   } = ctx;
//
//   const app = await App.findByPk(appId, {
//     attributes: ['id', 'OrganizationId', 'definition', 'template'],
//     ...(user && {
//       include: [
//         { model: Organization, attributes: ['id'] },
//         {
//           model: AppMember,
//           attributes: ['role', 'UserId'],
//           required: false,
//           where: { UserId: user.id },
//         },
//       ],
//     }),
//   });
//
//   const view = ctx.queryParams?.view;
//   const userQuery = await verifyPermission(ctx, app, resourceType, 'query');
//   const { order, query } = generateQuery(ctx);
//
//   const resources = await Resource.findAll({
//     include: [
//       { association: 'Author', attributes: ['id', 'name'], required: false },
//       { association: 'Editor', attributes: ['id', 'name'], required: false },
//     ],
//     limit: $top,
//     offset: $skip,
//     order,
//     where: {
//       [Op.and]: [
//         query,
//         {
//           ...userQuery,
//           type: resourceType,
//           AppId: appId,
//           expires: { [Op.or]: [{ [Op.gt]: new Date() }, null] },
//         },
//       ],
//     },
//   });
//
//   const exclude: string[] = app.template ? [] : undefined;
//   const include = $select?.split(',').map((s) => s.trim());
//   const mappedResources = resources.map((resource) => resource.toJSON({ exclude, include }));
//
//   if (view) {
//     const context = await getRemapperContext(
//       app,
//       app.definition.defaultLanguage || defaultLocale,
//       user && {
//         sub: user.id,
//         name: user.name,
//         email: user.primaryEmail,
//         email_verified: Boolean(user.EmailAuthorizations?.[0]?.verified),
//         zoneinfo: user.timezone,
//       },
//     );
//     ctx.body = mappedResources.map((resource) =>
//       remap(resourceDefinition.views[view].remap, resource, context),
//     );
//     return;
//   }
//
//   ctx.body = mappedResources;
// }

export const countResources = createCountResources(options);

// Export async function countResourcesOld(ctx: Context): Promise<void> {
//   const {
//     pathParams: { appId, resourceType },
//     user,
//   } = ctx;
//
//   const app = await App.findByPk(appId, {
//     attributes: ['id', 'definition', 'OrganizationId'],
//     ...(user && {
//       include: [
//         { model: Organization, attributes: ['id'] },
//         {
//           model: AppMember,
//           attributes: ['role', 'UserId'],
//           required: false,
//           where: { UserId: user.id },
//         },
//       ],
//     }),
//   });
//
//   const view = ctx.queryParams?.view;
//   getResourceDefinition(app, resourceType, view);
//   const userQuery = await verifyPermission(ctx, app, resourceType, 'count');
//   const { query } = generateQuery(ctx);
//
//   ctx.body = await Resource.count({
//     where: {
//       [Op.and]: [
//         query,
//         {
//           ...userQuery,
//           type: resourceType,
//           AppId: appId,
//           expires: { [Op.or]: [{ [Op.gt]: new Date() }, null] },
//         },
//       ],
//     },
//   });
// }

export const getResourceById = createGetResourceById(options);

// Export async function getResourceByIdOld(ctx: Context): Promise<void> {
//   const {
//     pathParams: { appId, resourceId, resourceType },
//     user,
//   } = ctx;
//
//   const app = await App.findByPk(appId, {
//     attributes: ['id', 'definition', 'OrganizationId'],
//     ...(user && {
//       include: [
//         { model: Organization, attributes: ['id'] },
//         {
//           model: AppMember,
//           attributes: ['role', 'UserId'],
//           required: false,
//           where: { UserId: user.id },
//         },
//       ],
//     }),
//   });
//   const view = ctx.queryParams?.view;
//   const resourceDefinition = getResourceDefinition(app, resourceType, view);
//   const userQuery = await verifyPermission(ctx, app, resourceType, 'get');
//
//   const resource = await Resource.findOne({
//     where: {
//       AppId: appId,
//       id: resourceId,
//       type: resourceType,
//       expires: { [Op.or]: [{ [Op.gt]: new Date() }, null] },
//       ...userQuery,
//     },
//     include: [
//       { association: 'Author', attributes: ['id', 'name'], required: false },
//       { association: 'Editor', attributes: ['id', 'name'], required: false },
//     ],
//   });
//
//   if (!resource) {
//     throw notFound('Resource not found');
//   }
//
//   if (view) {
//     const context = await getRemapperContext(
//       app,
//       app.definition.defaultLanguage || defaultLocale,
//       user && {
//         sub: user.id,
//         name: user.name,
//         email: user.primaryEmail,
//         email_verified: Boolean(user.EmailAuthorizations?.[0]?.verified),
//         zoneinfo: user.timezone,
//       },
//     );
//
//     ctx.body = remap(resourceDefinition.views[view].remap, resource.toJSON(), context);
//     return;
//   }
//
//   ctx.body = resource;
// }

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

// Export async function createResourceOld(ctx: Context): Promise<void> {
//   const {
//     pathParams: { appId, resourceType },
//     user,
//   } = ctx;
//   const action = 'create';
//
//   const app = await App.findByPk(appId, {
//     attributes: ['id', 'definition', 'OrganizationId', 'vapidPrivateKey', 'vapidPublicKey'],
//     include: user
//       ? [
//           { model: Organization, attributes: ['id'] },
//           {
//             model: AppMember,
//             attributes: ['role', 'UserId'],
//             required: false,
//             where: { UserId: user.id },
//           },
//         ]
//       : [],
//   });
//
//   const definition = getResourceDefinition(app, resourceType);
//   await verifyPermission(ctx, app, resourceType, action);
//
//   const [resource, preparedAssets] = processResourceBody(ctx, definition);
//   if (Array.isArray(resource) && !resource.length) {
//     ctx.body = [];
//     return;
//   }
//
//   await user?.reload({ attributes: ['name'] });
//   let createdResources: Resource[];
//   await transactional(async (transaction) => {
//     const resources = Array.isArray(resource) ? resource : [resource];
//     createdResources = await Resource.bulkCreate(
//       resources.map(({ $expires, ...data }) => ({
//         AppId: app.id,
//         type: resourceType,
//         data,
//         AuthorId: user?.id,
//         expires: $expires,
//       })),
//       { logging: false, transaction },
//     );
//     for (const createdResource of createdResources) {
//       createdResource.Author = user;
//     }
//     await Asset.bulkCreate(
//       preparedAssets.map((asset) => {
//         const index = resources.indexOf(asset.resource);
//         const { id: ResourceId } = createdResources[index];
//         return {
//           ...asset,
//           AppId: app.id,
//           ResourceId,
//           UserId: user?.id,
//         };
//       }),
//       { logging: false, transaction },
//     );
//   });
//
//   ctx.body = Array.isArray(resource) ? createdResources : createdResources[0];
//
//   processReferenceHooks(user, app, createdResources[0], action);
//   processHooks(user, app, createdResources[0], action);
// }

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

// Export async function updateResourceOld(ctx: Context): Promise<void> {
//   const {
//     pathParams: { appId, resourceId, resourceType },
//     user,
//   } = ctx;
//   const action = 'update';
//
//   const app = await App.findByPk(appId, {
//     attributes: ['id', 'definition', 'OrganizationId', 'vapidPrivateKey', 'vapidPublicKey'],
//     include: user
//       ? [
//           { model: Organization, attributes: ['id'] },
//           {
//             model: AppMember,
//             attributes: ['role', 'UserId'],
//             required: false,
//             where: { UserId: user.id },
//           },
//         ]
//       : [],
//   });
//
//   const definition = getResourceDefinition(app, resourceType);
//   const userQuery = await verifyPermission(ctx, app, resourceType, action);
//
//   const resource = await Resource.findOne({
//     where: { id: resourceId, type: resourceType, AppId: appId, ...userQuery },
//     include: [
//       { association: 'Author', attributes: ['id', 'name'], required: false },
//       { model: Asset, attributes: ['id'], required: false },
//     ],
//   });
//
//   if (!resource) {
//     throw notFound('Resource not found');
//   }
//
//   const [updatedResource, preparedAssets, deletedAssetIds] = processResourceBody(
//     ctx,
//     definition,
//     resource.Assets.map((asset) => asset.id),
//     resource.expires,
//   );
//
//   await transactional((transaction) => {
//     const oldData = resource.data;
//     const previousEditorId = resource.EditorId;
//     const promises: Promise<unknown>[] = [
//       resource.update({ data, clonable, expires, EditorId: user?.id }, { transaction }),
//     ];
//
//     if (preparedAssets.length) {
//       promises.push(
//         Asset.bulkCreate(
//           preparedAssets.map((asset) => ({
//             ...asset,
//             AppId: app.id,
//             ResourceId: resource.id,
//             UserId: user?.id,
//           })),
//           { logging: false, transaction },
//         ),
//       );
//     }
//
//     if (definition.history) {
//       promises.push(
//         ResourceVersion.create(
//           {
//             ResourceId: resourceId,
//             UserId: previousEditorId,
//             data: definition.history === true || definition.history.data ? oldData : undefined,
//           },
//           { transaction },
//         ),
//       );
//     } else {
//       promises.push(Asset.destroy({ where: { id: deletedAssetIds }, transaction }));
//     }
//
//     return Promise.all(promises);
//   });
//   await resource.reload({ include: [{ association: 'Editor' }] });
//
//   ctx.body = resource;
//
//   processReferenceHooks(user, app, resource, action);
//   processHooks(user, app, resource, action);
// }

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

// Export async function deleteResourceOld(ctx: Context): Promise<void> {
//   const {
//     pathParams: { appId, resourceId, resourceType },
//     user,
//   } = ctx;
//   const action = 'delete';
//
//   const app = await App.findByPk(appId, {
//     attributes: ['id', 'definition', 'OrganizationId', 'vapidPrivateKey', 'vapidPublicKey'],
//     include: user
//       ? [
//           { model: Organization, attributes: ['id'] },
//           {
//             model: AppMember,
//             attributes: ['role', 'UserId'],
//             required: false,
//             where: { UserId: user.id },
//           },
//         ]
//       : [],
//   });
//
//   getResourceDefinition(app, resourceType);
//   const userQuery = await verifyPermission(ctx, app, resourceType, action);
//
//   const resource = await Resource.findOne({
//     where: { id: resourceId, type: resourceType, AppId: appId, ...userQuery },
//   });
//
//   if (!resource) {
//     throw notFound('Resource not found');
//   }
//
//   await resource.destroy();
//   ctx.status = 204;
//
//   processReferenceHooks(user, app, resource, action);
//   processHooks(user, app, resource, action);
// }

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
