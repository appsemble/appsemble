import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App } from '../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../utils/authorization.js';

export async function deleteAppMaskableIcon(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;
  const app = await App.findByPk(appId, {
    attributes: ['id', 'maskableIcon', 'OrganizationId'],
  });

  assertKoaCondition(app != null, ctx, 404, 'App not found');
  assertKoaCondition(app.maskableIcon != null, ctx, 404, 'App has no maskable icon');

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.UpdateAppSettings],
  });

  await app.update({ maskableIcon: null });
}
