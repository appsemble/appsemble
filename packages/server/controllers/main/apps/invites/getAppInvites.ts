import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App, getAppDB } from '../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';

export async function getAppInvites(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;
  const app = await App.findByPk(appId, { attributes: ['OrganizationId'] });
  assertKoaCondition(app != null, ctx, 404, 'App not found.');

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.QueryAppInvites],
  });

  const { AppInvite } = await getAppDB(appId);
  const appInvites = await AppInvite.findAll();

  ctx.body = appInvites.map(({ email, role }) => ({
    email,
    role,
  }));
}
