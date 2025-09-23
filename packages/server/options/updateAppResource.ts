import {
  getCompressedFileMeta,
  type UpdateAppResourceParams,
  uploadAssets,
} from '@appsemble/node-utils';
import { type Resource as ResourceInterface } from '@appsemble/types';

import { getCurrentAppMember } from './getCurrentAppMember.js';
import { App, getAppDB } from '../models/index.js';
import { processHooks, processReferenceHooks } from '../utils/resource.js';

export async function updateAppResource({
  app,
  context,
  deletedAssetIds,
  id,
  options,
  preparedAssets,
  resource,
  resourceDefinition,
}: UpdateAppResourceParams): Promise<ResourceInterface | null> {
  const { Asset, Resource, ResourceVersion, sequelize } = await getAppDB(app.id!);
  const member = await getCurrentAppMember({ context, app });

  const persistedApp = (await App.findOne({ where: { id: app.id } }))!;

  const { $clonable: clonable, $expires: expires, ...data } = resource as Record<string, unknown>;

  return sequelize.transaction(async (transaction) => {
    const oldResource = (await Resource.findOne({
      where: { id },
      include: [
        { association: 'Author', attributes: ['id', 'name'], required: false },
        { model: Asset, attributes: ['id'], required: false },
        { association: 'Group', attributes: ['id', 'name'], required: false },
      ],
      transaction,
    }))!;

    const oldData = oldResource.data;
    const previousEditorId = oldResource.EditorId;

    const newResource = await oldResource.update(
      {
        data,
        clonable,
        expires,
        EditorId: member?.sub,
      },
      { transaction },
    );

    if (preparedAssets.length) {
      await Asset.bulkCreate(
        preparedAssets.map((asset) => ({
          ...asset,
          ...getCompressedFileMeta(asset),
          ResourceId: id,
          AppMemberId: member?.sub,
          seed: newResource.seed,
          clonable: newResource.clonable,
          ephemeral: newResource.ephemeral,
        })),
        { logging: false, transaction },
      );

      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks)
      await uploadAssets(app.id, preparedAssets);
    }

    if (resourceDefinition.history) {
      await ResourceVersion.create(
        {
          ResourceId: id,
          AppMemberId: previousEditorId,
          data:
            resourceDefinition.history === true || resourceDefinition.history.data
              ? oldData
              : undefined,
        },
        { transaction },
      );
    } else {
      const { deleteAppAsset } = options;

      const assetPromises = deletedAssetIds.map(async (assetId) => {
        await deleteAppAsset({ context, app, id: assetId, transaction });
      });

      await Promise.all(assetPromises);
    }

    const reloaded = await newResource.reload({
      include: [{ association: 'Editor' }],
      transaction,
    });

    processReferenceHooks(persistedApp, newResource, 'update', options, context);
    processHooks(persistedApp, newResource, 'update', options, context);

    return reloaded.toJSON({ exclude: app.template ? ['$seed'] : undefined });
  });
}
