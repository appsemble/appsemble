import { type UpdateAppResourceParams } from '@appsemble/node-utils';
import { type Resource as ResourceInterface } from '@appsemble/types';

import { getCurrentAppMember } from './getCurrentAppMember.js';
import { App, Asset, ResourceVersion, transactional } from '../models/index.js';
import { Resource } from '../models/Resource.js';
import { getCompressedFileMeta, uploadAssetFile } from '../utils/assets.js';
import { processHooks, processReferenceHooks } from '../utils/resource.js';

export function updateAppResource({
  app,
  context,
  deletedAssetIds,
  id,
  options,
  preparedAssets,
  resource,
  resourceDefinition,
}: UpdateAppResourceParams): Promise<ResourceInterface | null> {
  return transactional(async (transaction) => {
    const member = await getCurrentAppMember({ context });

    const persistedApp = await App.findOne({
      where: {
        id: app.id,
      },
    });

    const { $clonable: clonable, $expires: expires, ...data } = resource as Record<string, unknown>;

    const oldResource = await Resource.findOne({
      where: {
        id,
      },
      include: [
        { association: 'Author', attributes: ['id', 'name'], required: false },
        { model: Asset, attributes: ['id'], required: false },
        { association: 'Group', attributes: ['id', 'name'], required: false },
      ],
    });

    const oldData = oldResource.data;
    const previousEditorId = resource.EditorId;

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
      const createdAssets = await Asset.bulkCreate(
        preparedAssets.map((asset) => ({
          ...asset,
          AppId: app.id,
          ResourceId: id,
          AppMemberId: member?.sub,
          seed: newResource.seed,
          clonable: newResource.clonable,
          ephemeral: newResource.ephemeral,
        })),
        { logging: false, transaction },
      );

      for (const asset of preparedAssets) {
        await uploadAssetFile(app.id, asset.id, {
          mime: asset.mime,
          path: asset.path,
        });
      }

      for (const asset of createdAssets) {
        await asset.update(getCompressedFileMeta(asset), { transaction });
      }
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
      include: [{ association: 'Editor' }, { association: 'App', attributes: ['template'] }],
      transaction,
    });

    processReferenceHooks(persistedApp, newResource, 'update', options, context);
    processHooks(persistedApp, newResource, 'update', options, context);

    return reloaded.toJSON({ exclude: reloaded.App.template ? ['$seed'] : undefined });
  });
}
