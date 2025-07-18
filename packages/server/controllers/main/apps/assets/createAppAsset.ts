import {
  assertKoaCondition,
  type AssetToUpload,
  getCompressedFileMeta,
  throwKoaError,
  uploadAssets,
} from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';
import { UniqueConstraintError } from 'sequelize';

import { App, type Asset, getAppDB } from '../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';

export async function createAppAsset(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: {
        clonable,
        file: { filename, mime, path },
        name,
      },
      query: { seed },
    },
  } = ctx;
  const app = await App.findByPk(appId, { attributes: ['id', 'demoMode', 'OrganizationId'] });
  assertKoaCondition(app != null, ctx, 404, 'App not found');

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.CreateAppAssets],
  });

  const { Asset } = await getAppDB(appId);

  let asset: Asset;
  const assetsToUpload: AssetToUpload[] = [];
  const compressedFileMeta = getCompressedFileMeta({ filename, mime });
  try {
    if (!(ctx.client && 'app' in ctx.client) && seed === 'true') {
      asset = await Asset.create({
        name,
        seed: true,
        ephemeral: false,
        clonable,
        ...compressedFileMeta,
      });

      if (app.demoMode) {
        assetsToUpload.push({ id: asset.id, mime, path });
        asset = await Asset.create({
          name,
          seed: false,
          ephemeral: true,
          clonable: false,
          ...compressedFileMeta,
        });
      }
    } else {
      asset = await Asset.create({
        name,
        ephemeral: app.demoMode,
        clonable,
        ...compressedFileMeta,
      });
    }
  } catch (error: unknown) {
    if (error instanceof UniqueConstraintError) {
      throwKoaError(ctx, 409, `An asset named ${name} already exists`);
    }
    throw error;
  }

  assetsToUpload.push({ id: asset.id, mime, path });
  await uploadAssets(appId, assetsToUpload);

  ctx.status = 201;
  ctx.body = { id: asset.id, mime, filename, name };
}
