import { assertKoaError, throwKoaError } from '@appsemble/node-utils';
import { Permission } from '@appsemble/utils';
import { type Context } from 'koa';
import { extension } from 'mime-types';
import { Op, UniqueConstraintError } from 'sequelize';

import { App, Asset, Resource } from '../models/index.js';
import { getUserAppAccount } from '../options/getUserAppAccount.js';
import { checkRole } from '../utils/checkRole.js';

export async function getAssets(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    queryParams: { $skip, $top },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId', 'demoMode'],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  await checkRole(ctx, app.OrganizationId, Permission.ReadAssets);

  const assets = await Asset.findAll({
    attributes: ['id', 'mime', 'filename', 'name', 'ResourceId'],
    include: [
      {
        model: Resource,
        attributes: ['type'],
        required: false,
      },
    ],
    where: { AppId: appId, ...(app.demoMode ? { seed: false, ephemeral: true } : {}) },
    offset: $skip,
    limit: $top,
  });

  ctx.body = assets.map((asset) => ({
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
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  await checkRole(ctx, app.OrganizationId, Permission.ReadAssets);

  const count = await Asset.count({
    where: { AppId: appId, ...(app.demoMode ? { seed: false, ephemeral: true } : {}) },
  });
  ctx.body = count;
}

export async function getAssetById(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, assetId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  const assets = await Asset.findAll({
    where: {
      AppId: appId,
      [Op.or]: [{ id: assetId }, { name: assetId }],
      ...(app.demoMode ? { seed: false, ephemeral: true } : {}),
    },
  });

  // Pick asset id over asset name.
  const asset = assets.find((a) => a.id === assetId) || assets.find((a) => a.name === assetId);

  assertKoaError(!asset, ctx, 404, 'Asset not found');

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

  ctx.set('Access-Control-Expose-Headers', 'Content-Disposition');
  ctx.set('Cache-Control', 'max-age=31536000,immutable');
  ctx.body = asset.data;
}

export async function createAsset(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: {
        clonable,
        file: { contents, filename, mime },
        name,
      },
    },
    user,
  } = ctx;

  const app = await App.findByPk(appId, { attributes: ['id', 'demoMode'] });
  const appMember = await getUserAppAccount(appId, user?.id);

  assertKoaError(!app, ctx, 404, 'App not found');

  let asset: Asset;
  try {
    asset = await Asset.create({
      AppId: appId,
      data: contents,
      filename,
      mime,
      name,
      AppMemberId: appMember?.id,
      ephemeral: app.demoMode,
      clonable,
    });
  } catch (error: unknown) {
    if (error instanceof UniqueConstraintError) {
      throwKoaError(ctx, 409, `An asset named ${name} already exists`);
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
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  await checkRole(ctx, app.OrganizationId, Permission.ReadAssets);

  const assets = await Asset.findAll({
    where: {
      AppId: appId,
      id: assetId,
      ...(app.demoMode ? { seed: false, ephemeral: true } : {}),
    },
  });

  const [asset] = assets;
  assertKoaError(!asset, ctx, 404, 'Asset not found');

  await checkRole(ctx, app.OrganizationId, Permission.ManageAssets);
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

  assertKoaError(!app, ctx, 404, 'App not found');

  await checkRole(ctx, app.OrganizationId, Permission.ManageAssets);
  const assets = await Asset.findAll({
    where: { id: body, AppId: appId },
    ...(app.demoMode ? { seed: false, ephemeral: true } : {}),
  });
  assertKoaError(assets.length === 0, ctx, 404, 'Assets not found');
  assets.map(async (asset) => {
    await asset.destroy();
  });

  ctx.status = 204;
}

export async function seedAsset(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: {
        clonable,
        file: { contents, filename, mime },
        name,
      },
    },
    user,
  } = ctx;

  const app = await App.findByPk(appId, { attributes: ['id', 'demoMode'] });
  const appMember = await getUserAppAccount(appId, user?.id);

  assertKoaError(!app, ctx, 404, 'App not found');

  let asset: Asset;
  try {
    asset = await Asset.create({
      AppId: appId,
      data: contents,
      filename,
      mime,
      name,
      AppMemberId: appMember?.id,
      seed: true,
      ephemeral: false,
      clonable,
    });

    if (app.demoMode) {
      asset = await Asset.create({
        AppId: appId,
        data: contents,
        filename,
        mime,
        name,
        AppMemberId: appMember?.id,
        seed: false,
        ephemeral: true,
        clonable: false,
      });
    }
  } catch (error: unknown) {
    if (error instanceof UniqueConstraintError) {
      throwKoaError(ctx, 409, `An asset named ${name} already exists`);
    }
    throw error;
  }

  ctx.status = 201;
  ctx.body = { id: asset.id, mime, filename, name };
}

export async function deleteSeedAssets(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, { attributes: ['id', 'demoMode'] });

  assertKoaError(!app, ctx, 404, 'App not found');

  const seededAssets = await Asset.findAll({
    attributes: ['id'],
    where: {
      AppId: app.id,
      [Op.or]: [{ seed: true }, { ephemeral: true }],
    },
  });

  for (const seededAsset of seededAssets) {
    await seededAsset.destroy();
  }

  ctx.status = 204;
}
