import {
  assertKoaCondition,
  deleteS3Files,
  extractResourceBody,
  getCompressedFileMeta,
  getResourceDefinition,
  processResourceBody,
  throwKoaError,
  uploadAssets,
} from '@appsemble/node-utils';
import { type Resource as ResourceInterface } from '@appsemble/types';
import { type Context } from 'koa';

import { App, getAppDB, type Resource } from '../../../../models/index.js';
import { getCurrentAppMember } from '../../../../options/index.js';
import { options } from '../../../../options/options.js';
import { checkAuthSubjectAppPermissions } from '../../../../utils/authorization.js';
import { processHooks, processReferenceHooks } from '../../../../utils/resource.js';

export async function updateAppResources(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, resourceType },
    queryParams: { selectedGroupId },
  } = ctx;
  const app = await App.findByPk(appId, {
    attributes: ['definition', 'id'],
  });
  assertKoaCondition(app != null, ctx, 404, 'App not found');

  const { Asset, Resource, ResourceVersion, sequelize } = await getAppDB(appId);

  await checkAuthSubjectAppPermissions({
    context: ctx,
    appId,
    requiredPermissions: [`$resource:${resourceType}:update`],
    groupId: selectedGroupId,
  });

  const appMember = await getCurrentAppMember({ context: ctx, app: app.toJSON() });

  const definition = getResourceDefinition(app.definition, resourceType, ctx);

  const resourcesPayload = extractResourceBody(ctx)[0] as ResourceInterface[];

  if (!resourcesPayload.length) {
    ctx.body = [];
    return;
  }

  if (resourcesPayload.some((resource) => !resource.id)) {
    throwKoaError(
      ctx,
      400,
      'There is a resource with a missing id.',
      resourcesPayload.filter((resource) => !resource.id),
    );
  }

  const existingResources = await Resource.findAll({
    where: {
      id: resourcesPayload.map((resource) => Number(resource.id)),
      type: resourceType,
      GroupId: selectedGroupId ?? null,
    },
    include: [
      { association: 'Author', attributes: ['id', 'name'], required: false },
      { association: 'Editor', attributes: ['id', 'name'], required: false },
      { model: Asset, attributes: ['id'], required: false },
    ],
  });

  const [preparedResources, preparedAssets, unusedAssetIds] = processResourceBody(
    ctx,
    definition,
    existingResources.flatMap((resource) => resource.Assets.map((asset) => asset.id)),
  );

  const processedResources = preparedResources as ResourceInterface[];

  if (existingResources.length !== processedResources.length) {
    const resourceIds = new Set(existingResources.map((resource) => resource.id));

    throwKoaError(
      ctx,
      400,
      'One or more resources could not be found.',
      processedResources.filter((resource) => !resourceIds.has(resource.id)),
    );
  }

  let updatedResources: Resource[];
  await sequelize.transaction(async (transaction) => {
    updatedResources = await Promise.all(
      processedResources.map(async ({ $author, $created, $editor, $updated, id, ...data }) => {
        const [, [resource]] = await Resource.update(
          {
            data,
            EditorId: appMember?.sub,
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
        where: { id: unusedAssetIds },
        transaction,
      });

      await deleteS3Files(`app-${appId}`, unusedAssetIds);
    }

    if (preparedAssets.length) {
      await Asset.bulkCreate(
        preparedAssets.map((asset) => {
          const index = processedResources.indexOf(asset.resource as ResourceInterface);
          const { id: ResourceId } = processedResources[index];
          return {
            ...asset,
            ...getCompressedFileMeta(asset),
            GroupId: selectedGroupId ?? null,
            ResourceId,
            AppMemberId: appMember?.sub,
          };
        }),
        { logging: false, transaction },
      );

      await uploadAssets(app.id, preparedAssets);
    }

    ctx.body = updatedResources;

    for (const resource of updatedResources) {
      processReferenceHooks(app, resource, 'update', options, ctx);
      processHooks(app, resource, 'update', options, ctx);
    }
  });
}
