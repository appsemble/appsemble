import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App, Group, GroupInvite } from '../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';

export async function deleteGroupInvite(ctx: Context): Promise<void> {
  const { request } = ctx;

  const email = request.body.email.toLowerCase();
  const invite = await GroupInvite.findOne({ where: { email } });

  assertKoaCondition(invite != null, ctx, 404, 'This invite does not exist');

  const group = await Group.findByPk(invite.GroupId, { attributes: ['AppId'] });

  const app = await App.findByPk(group.AppId, { attributes: ['OrganizationId'] });

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.DeleteGroupInvites],
  });

  await invite.destroy();
}
