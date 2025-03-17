import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App } from '../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../utils/authorization.js';

export async function deleteAppIcon(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;
  const app = await App.findByPk(appId, {
    attributes: ['id', 'icon', 'OrganizationId'],
  });

  assertKoaCondition(!!app, ctx, 404, 'App not found');
  assertKoaCondition(!!app.icon, ctx, 404, 'App has no icon');

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.UpdateAppSettings],
  });

  await app.update({ icon: null });
}
