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
import { type Asset, getAppDB } from '../models/index.js';

export async function createAppAsset({
  app,
  context,
  payload,
}: CreateAppAssetParams): Promise<AppAsset> {
  const { filename, mime, name, path } = payload;

  const member = await getCurrentAppMember({ context, app });

  let asset: Asset;
  try {
    const { Asset } = await getAppDB(app.id!);
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

  // @ts-expect-error 2345 argument of type is not assignable to parameter of type
  // (strictNullChecks)
  await uploadAssets(app.id, [{ id: asset.id, mime, path }]);

  // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
  return { ...asset, stream: await getS3File(`app-${app.id}`, asset.id) };
}
