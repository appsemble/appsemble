import {
  type AppAsset,
  type CreateAppAssetParams,
  getS3File,
  throwKoaError,
} from '@appsemble/node-utils';
import { UniqueConstraintError } from 'sequelize';

import { getCurrentAppMember } from './getCurrentAppMember.js';
import { Asset } from '../models/Asset.js';
import { getCompressedFileMeta, uploadAssetFile } from '../utils/assets.js';

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
      filename,
      mime,
      name,
      AppMemberId: member?.sub,
    });
  } catch (error: unknown) {
    if (error instanceof UniqueConstraintError) {
      throwKoaError(context, 409, `An asset named ${name} already exists`);
    }
    throw error;
  }

  await uploadAssetFile(app.id, asset.id, { mime, path });
  await asset.update(getCompressedFileMeta(asset));

  return { ...asset, stream: await getS3File(`app-${app.id}`, asset.id) };
}
