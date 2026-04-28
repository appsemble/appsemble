import {
  AssetUploadValidationError,
  type AppAsset,
  type CreateAppAssetParams,
  deleteS3Files,
  getCompressedFileMeta,
  getS3File,
  throwKoaError,
  uploadAssets,
  validateUploadedFile,
} from '@appsemble/node-utils';
import { UniqueConstraintError } from 'sequelize';

import { getCurrentAppMember } from './getCurrentAppMember.js';
import { type Asset, getAppDB } from '../models/index.js';

export async function createAppAsset({
  app,
  context,
  payload,
}: CreateAppAssetParams): Promise<AppAsset> {
  const { filename, mime, name, path } = payload;

  let validatedMime: string;
  try {
    validatedMime = await validateUploadedFile({ filename, mime, path });
  } catch (error) {
    if (error instanceof AssetUploadValidationError) {
      throwKoaError(context, 400, error.message);
    }
    throw error;
  }

  const member = await getCurrentAppMember({ context, app });
  const { Asset, sequelize } = await getAppDB(app.id!);
  const assetId = Asset.build().id;

  // @ts-expect-error 2345 argument of type is not assignable to parameter of type
  // (strictNullChecks)
  await uploadAssets(app.id, [{ id: assetId, mime: validatedMime, path }]);

  let asset: Asset;
  try {
    asset = await sequelize.transaction((transaction) =>
      Asset.create(
        {
          id: assetId,
          AppId: app.id,
          name,
          AppMemberId: member?.sub,
          ...getCompressedFileMeta({ filename, mime: validatedMime }),
        },
        { transaction },
      ),
    );
  } catch (error: unknown) {
    await deleteS3Files(`app-${app.id}`, [assetId]);
    if (error instanceof UniqueConstraintError) {
      throwKoaError(context, 409, `An asset named ${name} already exists`);
    }
    throw error;
  }

  // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
  return { ...asset, stream: await getS3File(`app-${app.id}`, asset.id) };
}
