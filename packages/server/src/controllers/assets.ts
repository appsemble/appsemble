import { Permission } from '@appsemble/utils';
import { notFound } from '@hapi/boom';
import { Context } from 'koa';
import { extension } from 'mime-types';

import { App, Asset, User } from '../models';
import { checkRole } from '../utils/checkRole';

export async function getAssets(ctx: Context): Promise<void> {
  const {
    params: { appId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
    include: [{ model: Asset, attributes: ['id', 'mime', 'filename'], required: false }],
  });

  if (!app) {
    throw notFound('App not found');
  }

  await checkRole(ctx, app.OrganizationId, Permission.ReadAssets);

  ctx.body = app.Assets.map((asset) => ({
    id: asset.id,
    mime: asset.mime,
    filename: asset.filename,
  }));
}

export async function getAssetById(ctx: Context): Promise<void> {
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

  let { filename, mime } = asset;
  if (!filename) {
    filename = asset.id;
    if (mime) {
      const ext = extension(mime);
      if (ext) {
        filename += `.${ext}`;
      }
    }
  }
  ctx.set('content-type', mime || 'application/octet-stream');
  ctx.set('content-disposition', `attachment; filename=${JSON.stringify(filename)}`);
  ctx.body = asset.data;
}

export async function createAsset(ctx: Context): Promise<void> {
  const {
    params: { appId },
    request: { body, type },
  } = ctx;
  const user = ctx.user as User;

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

export async function deleteAsset(ctx: Context): Promise<void> {
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
