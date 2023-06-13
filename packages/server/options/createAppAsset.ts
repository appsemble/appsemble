import { type AppAsset, type CreateAppAssetParams } from '@appsemble/node-utils';
import { conflict } from '@hapi/boom';
import { UniqueConstraintError } from 'sequelize';

import { Asset } from '../models/Asset.js';

export async function createAppAsset({
  app,
  context,
  payload,
}: CreateAppAssetParams): Promise<AppAsset> {
  const { data, filename, mime, name } = payload;

  let asset: Asset;
  try {
    asset = await Asset.create({
      AppId: app.id,
      data,
      filename,
      mime,
      name,
      UserId: context.user?.id,
    });
  } catch (error: unknown) {
    if (error instanceof UniqueConstraintError) {
      throw conflict(`An asset named ${name} already exists`);
    }
    throw error;
  }

  return asset;
}
