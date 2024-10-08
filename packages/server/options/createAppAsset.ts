import { type AppAsset, type CreateAppAssetParams, throwKoaError } from '@appsemble/node-utils';
import { UniqueConstraintError } from 'sequelize';

import { getCurrentAppMember } from './getCurrentAppMember.js';
import { Asset } from '../models/Asset.js';

export async function createAppAsset({
  app,
  context,
  payload,
}: CreateAppAssetParams): Promise<AppAsset> {
  const { data, filename, mime, name } = payload;

  const member = await getCurrentAppMember({ context });

  let asset: Asset;
  try {
    asset = await Asset.create({
      AppId: app.id,
      data,
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

  return asset;
}
