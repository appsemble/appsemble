import {
  AssetUploadValidationError,
  assertKoaCondition,
  deleteS3Files,
  type AssetToUpload,
  getCompressedFileMeta,
  throwKoaError,
  uploadAssets,
  validateUploadedFile,
} from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';
import { UniqueConstraintError } from 'sequelize';

import { App, type Asset, getAppDB } from '../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';

export async function createAppAsset(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: {
        clonable,
        file: { filename, mime, path },
        name,
      },
      query: { seed },
    },
  } = ctx;
  const app = await App.findByPk(appId, { attributes: ['id', 'demoMode', 'OrganizationId'] });
  assertKoaCondition(app != null, ctx, 404, 'App not found');

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.CreateAppAssets],
  });

  const { Asset, sequelize } = await getAppDB(appId);

  let validatedMime: string;
  try {
    validatedMime = await validateUploadedFile({ filename, mime, path });
  } catch (error) {
    if (error instanceof AssetUploadValidationError) {
      throwKoaError(ctx, 400, error.message);
    }
    throw error;
  }

  let asset: Asset;
  const seedAssetId = Asset.build().id;
  const ephemeralAssetId =
    app.demoMode && !(ctx.client && 'app' in ctx.client) && seed === 'true'
      ? Asset.build().id
      : null;
  const assetsToUpload: AssetToUpload[] = [
    { id: seedAssetId, mime: validatedMime, path },
    ...(ephemeralAssetId ? [{ id: ephemeralAssetId, mime: validatedMime, path }] : []),
  ];
  const compressedFileMeta = getCompressedFileMeta({ filename, mime: validatedMime });

  await uploadAssets(appId, assetsToUpload);

  try {
    asset = await sequelize.transaction(async (transaction) => {
      if (!(ctx.client && 'app' in ctx.client) && seed === 'true') {
        await Asset.create(
          {
            id: seedAssetId,
            name,
            seed: true,
            ephemeral: false,
            clonable,
            ...compressedFileMeta,
          },
          { transaction },
        );

        if (app.demoMode) {
          return Asset.create(
            {
              id: ephemeralAssetId!,
              name,
              seed: false,
              ephemeral: true,
              clonable: false,
              ...compressedFileMeta,
            },
            { transaction },
          );
        }

        return Asset.findByPk(seedAssetId, { transaction }) as Promise<Asset>;
      }

      return Asset.create(
        {
          id: seedAssetId,
          name,
          ephemeral: app.demoMode,
          clonable,
          ...compressedFileMeta,
        },
        { transaction },
      );
    });
  } catch (error: unknown) {
    await deleteS3Files(
      `app-${appId}`,
      assetsToUpload.map(({ id }) => id),
    );
    if (error instanceof UniqueConstraintError) {
      throwKoaError(ctx, 409, `An asset named ${name} already exists`);
    }
    throw error;
  }

  ctx.status = 201;
  ctx.body = { id: asset.id, mime: asset.mime, filename, name };
}
