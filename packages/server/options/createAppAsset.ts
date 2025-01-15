import {
  type AppAsset,
  type CreateAppAssetParams,
  getCompressedFileMeta,
  getS3File,
  throwKoaError,
  uploadAssets,
} from '@appsemble/node-utils';
import { UniqueConstraintError } from 'sequelize';

import { getCurrentAppMember } from './getCurrentAppMember.js';
import { Asset } from '../models/Asset.js';

export async function createAppAsset({
  app,
  context,
  payload,
}: CreateAppAssetParams): Promise<AppAsset> {
  const { filename, mime, name, path } = payload;

  const member = await getCurrentAppMember({ context });

  let asset: Asset;
  try {
    asset = await Asset.create({
      AppId: app.id,
      name,
      AppMemberId: member?.sub,
      ...getCompressedFileMeta({ filename, mime }),
    });
  } catch (error: unknown) {
    if (error instanceof UniqueConstraintError) {
      throwKoaError(context, 409, `An asset named ${name} already exists`);
    }
    throw error;
  }

  await uploadAssets(app.id, [{ id: asset.id, mime, path }]);

  return { ...asset, stream: await getS3File(`app-${app.id}`, asset.id) };
}
