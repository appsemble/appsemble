import { type AppAsset, type CreateAppAssetParams, throwKoaError } from '@appsemble/node-utils';
import { UniqueConstraintError } from 'sequelize';

import { getUserAppAccount } from './getUserAppAccount.js';
import { Asset } from '../models/Asset.js';

export async function createAppAsset({
  app,
  context,
  payload,
}: CreateAppAssetParams): Promise<AppAsset> {
  const { data, filename, mime, name } = payload;

  const member = await getUserAppAccount(app?.id, context.user?.id);

  let asset: Asset;
  const ctx = context;
  try {
    asset = await Asset.create({
      AppId: app.id,
      data,
      filename,
      mime,
      name,
      AppMemberId: member?.id,
    });
  } catch (error: unknown) {
    if (error instanceof UniqueConstraintError) {
      throwKoaError(ctx, 409, `An asset named ${name} already exists`);
    }
    throw error;
  }

  return asset;
}
