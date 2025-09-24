import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App, getAppDB } from '../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';

export async function queryAppAssets(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    queryParams: { $skip, $top },
  } = ctx;
  const app = await App.findByPk(appId, { attributes: ['OrganizationId', 'demoMode'] });
  assertKoaCondition(app != null, ctx, 404, 'App not found');

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.QueryAppAssets],
  });

  const { Asset, Resource } = await getAppDB(appId);
  const assets = await Asset.findAll({
    attributes: ['id', 'mime', 'filename', 'name', 'ResourceId'],
    include: [
      {
        model: Resource,
        attributes: ['type'],
        required: false,
      },
    ],
    where: {
      ...(app.demoMode ? { seed: false, ephemeral: true } : {}),
    },
    offset: $skip,
    limit: $top,
    order: [['filename', 'ASC']],
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
