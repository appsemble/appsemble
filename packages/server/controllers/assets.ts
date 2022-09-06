import { Permission } from '@appsemble/utils';
import { conflict, notFound } from '@hapi/boom';
import { Context } from 'koa';
import { extension } from 'mime-types';
import { Op, UniqueConstraintError } from 'sequelize';

import { App, Asset, Resource } from '../models/index.js';
import { checkRole } from '../utils/checkRole.js';

export async function getAssets(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    queryParams: { $skip, $top },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
    include: [
      {
        model: Asset,
        attributes: ['id', 'mime', 'filename', 'name', 'ResourceId'],
        required: false,
        include: [
          {
            model: Resource,
            attributes: ['type'],
            required: false,
          },
        ],
      },
    ],
  });

  if (!app) {
    throw notFound('App not found');
  }

  await checkRole(ctx, app.OrganizationId, Permission.ReadAssets);

  ctx.body = app.Assets.slice($skip, $skip + $top).map((asset) => ({
    id: asset.id,
    resourceId: asset.ResourceId ?? undefined,
    resourceType: asset.Resource?.type,
    mime: asset.mime,
    filename: asset.filename,
    name: asset.name || undefined,
  }));
}

export async function countAssets(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
    include: [
      {
        model: Asset,
        attributes: ['id', 'mime', 'filename', 'name', 'ResourceId'],
        required: false,
        include: [
          {
            model: Resource,
            attributes: ['type'],
            required: false,
          },
        ],
      },
    ],
  });

  if (!app) {
    throw notFound('App not found');
  }

  await checkRole(ctx, app.OrganizationId, Permission.ReadAssets);

  ctx.body = app.Assets.length || 0;
}

export async function getAssetById(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, assetId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: [],
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

  if (assetId !== asset.id) {
    // Redirect to asset using current asset ID
    ctx.status = 302;
    ctx.set('location', `/api/apps/${appId}/assets/${asset.id}`);
    ctx.type = null;
    return;
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

  ctx.set('Cache-Control', 'max-age=31536000,immutable');
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

  const app = await App.findByPk(appId, { attributes: ['id'] });

  if (!app) {
    throw notFound('App not found');
  }

  let asset: Asset;
  try {
    asset = await Asset.create({
      AppId: appId,
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

export async function deleteAssets(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: { body },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
  });

  if (!app) {
    throw notFound('App not found');
  }

  await checkRole(ctx, app.OrganizationId, Permission.ManageResources);
  await Asset.destroy({ where: { id: body } });

  ctx.status = 204;
}
