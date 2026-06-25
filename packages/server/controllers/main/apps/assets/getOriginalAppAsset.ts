import {
  assertKoaCondition,
  getS3File,
  getS3FileStats,
  setAssetHeaders,
} from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';
import { extension } from 'mime-types';
import { Op } from 'sequelize';

import { App, getAppDB } from '../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';

function getAssetFilename(assetId: string, filename?: string | null, mime?: string | null): string {
  if (filename) {
    return filename;
  }

  if (mime) {
    const ext = extension(mime);
    if (ext) {
      return `${assetId}.${ext}`;
    }
  }

  return assetId;
}

export async function getOriginalAppAsset(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, assetId },
  } = ctx;
  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId', 'demoMode'],
  });
  assertKoaCondition(app != null, ctx, 404, 'App not found');

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.QueryAppAssets],
  });

  const { Asset } = await getAppDB(appId);
  const asset = await Asset.findOne({
    where: {
      [Op.or]: [{ id: assetId }, { name: assetId }],
      ...(app.demoMode ? { seed: false, ephemeral: true } : {}),
    },
    attributes: ['id', 'mime', 'filename', 'name'],
  });
  assertKoaCondition(asset != null, ctx, 404, 'Asset not found');

  const bucketName = `app-${appId}`;
  const filename = getAssetFilename(asset.id, asset.filename, asset.mime);
  const stats = await getS3FileStats(bucketName, asset.id);
  const stream = await getS3File(bucketName, asset.id);

  setAssetHeaders(ctx, asset.mime ?? 'application/octet-stream', filename, stats);
  ctx.body = stream;
}
