import Boom from '@hapi/boom';

import { App, Asset } from '../models';

export async function getAssets(ctx) {
  const { appId } = ctx.params;
  const app = await App.findByPk(appId, {
    include: [{ model: Asset, required: false }],
  });

  if (!app) {
    throw Boom.notFound('App not found');
  }

  ctx.body = app.Assets.map((asset) => ({
    id: asset.id,
    mime: asset.mime,
    filename: asset.filename,
  }));
}

export async function getAssetById(ctx) {
  const { appId, assetId } = ctx.params;

  const app = await App.findByPk(appId, {
    include: [{ model: Asset, where: { id: assetId }, required: false }],
  });

  if (!app) {
    throw Boom.notFound('App not found');
  }

  const [asset] = app.Assets;

  if (!asset) {
    throw Boom.notFound('Asset not found');
  }

  ctx.set('Content-Type', asset.mime || 'application/octet-stream');
  ctx.body = asset.data;
}

export async function createAsset(ctx) {
  const { request } = ctx;
  const { appId } = ctx.params;
  const { body, type } = request;
  const { user } = ctx.state;

  const app = await App.findByPk(appId);

  if (!app) {
    throw Boom.notFound('App not found');
  }

  const asset = await app.createAsset(
    { mime: type, data: body, ...(user && { UserId: user.id }) },
    { raw: true },
  );

  ctx.status = 201;
  ctx.body = { id: asset.id };
}
