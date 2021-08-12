import { Permission } from '@appsemble/utils';
import { conflict, notFound } from '@hapi/boom';
import { Context } from 'koa';
import { extension } from 'mime-types';
import { Op, UniqueConstraintError } from 'sequelize';

import { App, Asset } from '../models';
import { checkRole } from '../utils/checkRole';

export async function getAssets(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
    include: [{ model: Asset, attributes: ['id', 'mime', 'filename', 'name'], required: false }],
  });

  if (!app) {
    throw notFound('App not found');
  }

  await checkRole(ctx, app.OrganizationId, Permission.ReadAssets);

  ctx.body = app.Assets.map((asset) => ({
    id: asset.id,
    mime: asset.mime,
    filename: asset.filename,
    name: asset.name || undefined,
  }));
}

export async function getAssetById(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, assetId },
  } = ctx;

  const app = await App.findByPk(appId, {
    include: [
      { model: Asset, where: { [Op.or]: [{ id: assetId }, { name: assetId }] }, required: false },
    ],
  });

  if (!app) {
    throw notFound('App not found');
  }

  // Pick asset id over asset name.
  const asset =
    app.Assets.find((a) => a.id === assetId) || app.Assets.find((a) => a.name === assetId);

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
  if (filename) {
    ctx.set('content-disposition', `attachment; filename=${JSON.stringify(filename)}`);
  }
  ctx.body = asset.data;
}

export async function createAsset(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: {
        file: { contents, filename, mime },
        name,
      },
    },
    user,
  } = ctx;

  const app = await App.findByPk(appId);

  if (!app) {
    throw notFound('App not found');
  }

  let asset: Asset;
  try {
    asset = await Asset.create({
      AppId: app.id,
      data: contents,
      filename,
      mime,
      name,
      UserId: user?.id,
    });
  } catch (error: unknown) {
    if (error instanceof UniqueConstraintError) {
      throw conflict(`An asset named ${name} already exists`);
    }
    throw error;
  }

  ctx.status = 201;
  ctx.body = { id: asset.id, mime, filename, name };
}

export async function deleteAsset(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, assetId },
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
