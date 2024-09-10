import {
  extractResourceBody,
  getResourceDefinition,
  processResourceBody,
  throwKoaError,
} from '@appsemble/node-utils';
import { type Resource as ResourceType } from '@appsemble/types';
import { type Context } from 'koa';

import {
  App,
  AppMember,
  Asset,
  Organization,
  Resource,
  ResourceVersion,
  transactional,
  type User,
} from '../../../../models/index.js';
import { getUserAppAccount } from '../../../../options/index.js';
import { options } from '../../../../options/options.js';
import { processHooks, processReferenceHooks } from '../../../../utils/resource.js';

export async function updateAppResources(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, resourceType },
    user,
  } = ctx;
  const { verifyResourceActionPermission } = options;

  const action = 'update';

  const app = await App.findByPk(appId, {
    attributes: ['id', 'definition', 'OrganizationId', 'vapidPrivateKey', 'vapidPublicKey'],
    include: user
      ? [
          { model: Organization, attributes: ['id'] },
          {
            model: AppMember,
            attributes: ['role', 'id', 'UserId'],
            required: false,
            where: { id: user.id },
          },
        ]
      : [],
  });

  const appMember = await getUserAppAccount(app.id, user?.id);

  const definition = getResourceDefinition(app.toJSON(), resourceType, ctx);
  const memberQuery = await verifyResourceActionPermission({
    context: ctx,
    app: app.toJSON(),
    resourceType,
    action,
    options,
    ctx,
  });
  const resourceList = extractResourceBody(ctx)[0] as ResourceType[];

  if (!resourceList.length) {
    ctx.body = [];
    return;
  }

  if (resourceList.some((r) => !r.id)) {
    throwKoaError(
      ctx,
      400,
      'List of resources contained a resource without an ID.',
      resourceList.filter((r) => !r.id),
    );
  }

  const existingResources = await Resource.findAll({
    where: {
      id: resourceList.map((r) => Number(r.id)),
      type: resourceType,
      AppId: appId,
      ...memberQuery,
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

    throwKoaError(
      ctx,
      400,
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
            EditorId: appMember?.id,
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
          AppMemberId: resource.EditorId,
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
            AppMemberId: appMember?.id,
          };
        }),
        { logging: false, transaction },
      );
    }
  });

  ctx.body = updatedResources;

  for (const resource of updatedResources) {
    processReferenceHooks(user as User, app, resource, action, options, ctx);
    processHooks(user as User, app, resource, action, options, ctx);
  }
}
