import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App, AppInvite } from '../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';

export async function deleteAppInvite(ctx: Context): Promise<void> {
  const { request } = ctx;

  const email = request.body.email.toLowerCase();
  const invite = await AppInvite.findOne({ where: { email } });

  assertKoaCondition(!!invite, ctx, 404, 'This invite does not exist');

  const app = await App.findByPk(invite.AppId, { attributes: ['OrganizationId'] });

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.DeleteAppInvites],
  });

  await invite.destroy();
}
