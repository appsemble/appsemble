import Boom from '@hapi/boom';

export async function getAssetById(ctx) {
  const { assetId } = ctx.params;
  const { Asset } = ctx.db.models;

  const asset = await Asset.findByPk(assetId);

  if (!asset) {
    throw Boom.notFound('Asset not found');
  }

  ctx.set('Content-Type', asset.mime || 'application/octet-stream');
  ctx.body = asset.data;
}

export async function createAsset(ctx) {
  const { db, request } = ctx;
  const { Asset } = db.models;
  const { body, type } = request;
  const asset = await Asset.create({ mime: type, data: body }, { raw: true });

  ctx.status = 201;
  ctx.body = { id: asset.id };
}
