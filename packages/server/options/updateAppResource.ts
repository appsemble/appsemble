import { type UpdateAppResourceParams } from '@appsemble/node-utils';
import { type Resource as ResourceInterface } from '@appsemble/types';

import { getUserAppAccount } from './getUserAppAccount.js';
import { App, Asset, ResourceVersion, transactional, type User } from '../models/index.js';
import { Resource } from '../models/Resource.js';
import { processHooks, processReferenceHooks } from '../utils/resource.js';

export function updateAppResource({
  action,
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
    const { user } = context;

    const member = await getUserAppAccount(app?.id, user?.id);

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
      ],
    });

    const oldData = oldResource.data;
    const previousEditorId = resource.EditorId;

    const newResource = await oldResource.update(
      {
        data,
        clonable,
        expires,
        EditorId: member?.id,
      },
      { transaction },
    );

    if (preparedAssets.length) {
      await Asset.bulkCreate(
        preparedAssets.map((asset) => ({
          ...asset,
          AppId: app.id,
          ResourceId: id,
          AppMemberId: member?.id,
          seed: newResource.seed,
          clonable: newResource.clonable,
          ephemeral: newResource.ephemeral,
        })),
        { logging: false, transaction },
      );
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

    processReferenceHooks(user as User, persistedApp, newResource, action, options, context);
    processHooks(user as User, persistedApp, newResource, action, options, context);

    return reloaded.toJSON({ exclude: reloaded.App.template ? ['$seed'] : undefined });
  });
}
