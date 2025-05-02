import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App, getAppDB } from '../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';

export async function deleteAppInvite(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request,
  } = ctx;
  const app = await App.findByPk(appId, { attributes: ['OrganizationId'] });
  assertKoaCondition(app != null, ctx, 404, 'App not found');

  const { AppInvite } = await getAppDB(appId);
  const email = request.body.email.toLowerCase();
  const invite = await AppInvite.findOne({ where: { email } });

  assertKoaCondition(invite != null, ctx, 404, 'This invite does not exist');

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.DeleteAppInvites],
  });

  await invite.destroy();
}
