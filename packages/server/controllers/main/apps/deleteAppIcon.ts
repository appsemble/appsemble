import { assertKoaError } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/utils';
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

  assertKoaError(!app, ctx, 404, 'App not found');
  assertKoaError(!app.icon, ctx, 404, 'App has no icon');

  await checkUserOrganizationPermissions(ctx, app.OrganizationId, [
    OrganizationPermission.UpdateAppSettings,
  ]);
  await app.update({ icon: null });
}
