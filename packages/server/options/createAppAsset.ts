import { type AppAsset, type CreateAppAssetParams } from '@appsemble/node-utils';
import { UniqueConstraintError } from 'sequelize';

import { Asset } from '../models/Asset.js';

export async function createAppAsset({
  app,
  context,
  payload,
}: CreateAppAssetParams): Promise<AppAsset> {
  const { data, filename, mime, name } = payload;

  let asset: Asset;
  const ctx = context;
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
      ctx.response.status = 409;
      ctx.response.body = {
        statusCode: 409,
        error: 'Conflict',
        message: `An asset named ${name} already exists`,
      };
      ctx.throw();
    }
    throw error;
  }

  return asset;
}
