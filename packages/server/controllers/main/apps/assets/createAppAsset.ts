import { assertKoaError, throwKoaError } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';
import { UniqueConstraintError } from 'sequelize';

import { App, Asset } from '../../../../models/index.js';
import { getCompressedFileMeta, uploadAssetFile } from '../../../../utils/assets.js';
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

  assertKoaError(!app, ctx, 404, 'App not found');

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.CreateAppAssets],
  });

  let asset: Asset;
  try {
    if (!(ctx.client && 'app' in ctx.client) && seed === 'true') {
      asset = await Asset.create({
        AppId: appId,
        filename,
        mime,
        name,
        seed: true,
        ephemeral: false,
        clonable,
      });

      if (app.demoMode) {
        asset = await Asset.create({
          AppId: appId,
          filename,
          mime,
          name,
          seed: false,
          ephemeral: true,
          clonable: false,
        });
      }
    } else {
      asset = await Asset.create({
        AppId: appId,
        filename,
        mime,
        name,
        ephemeral: app.demoMode,
        clonable,
      });
    }
  } catch (error: unknown) {
    if (error instanceof UniqueConstraintError) {
      throwKoaError(ctx, 409, `An asset named ${name} already exists`);
    }
    throw error;
  }

  await uploadAssetFile(appId, asset.id, { mime, path });
  await asset.update(getCompressedFileMeta(asset));

  ctx.status = 201;
  ctx.body = { id: asset.id, mime, filename, name };
}
