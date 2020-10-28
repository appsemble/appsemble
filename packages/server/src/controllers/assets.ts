import { Permission } from '@appsemble/utils';
import { notFound } from '@hapi/boom';

import { App, Asset } from '../models';
import { KoaContext } from '../types';
import { checkRole } from '../utils/checkRole';

interface Params {
  appId: string;
  assetId: string;
}

export async function getAssets(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: [],
    include: [{ model: Asset, attributes: ['id', 'mime', 'filename'], required: false }],
  });

  if (!app) {
    throw notFound('App not found');
  }

  ctx.body = app.Assets.map((asset) => ({
    id: asset.id,
    mime: asset.mime,
    filename: asset.filename,
  }));
}

export async function getAssetById(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId, assetId },
  } = ctx;

  const app = await App.findByPk(appId, {
    include: [{ model: Asset, where: { id: assetId }, required: false }],
  });

  if (!app) {
    throw notFound('App not found');
  }

  const [asset] = app.Assets;

  if (!asset) {
    throw notFound('Asset not found');
  }

  ctx.set('Content-Type', asset.mime || 'application/octet-stream');
  ctx.body = asset.data;
}

export async function createAsset(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId },
    request: { body, type },
    user,
  } = ctx;

  const app = await App.findByPk(appId);

  if (!app) {
    throw notFound('App not found');
  }

  const asset = await Asset.create(
    { AppId: app.id, mime: type, data: body, ...(user && { UserId: user.id }) },
    { raw: true },
  );

  ctx.status = 201;
  ctx.body = { id: asset.id, mime: asset.mime, filename: asset.filename };
}

export async function deleteAsset(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId, assetId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
    include: [{ model: Asset, attributes: ['id'], where: { id: assetId }, required: false }],
  });

  if (!app) {
    throw notFound('App not found');
  }

  const [asset] = app.Assets;

  if (!asset) {
    throw notFound('Asset not found');
  }

  await checkRole(ctx, app.OrganizationId, Permission.ManageResources);
  await asset.destroy();
}
