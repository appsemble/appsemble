import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App, getAppDB } from '../../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../../utils/authorization.js';

export async function deleteGroupInvite(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request,
  } = ctx;
  const app = await App.findByPk(appId, { attributes: ['OrganizationId'] });
  assertKoaCondition(app != null, ctx, 404, 'App not found');

  const { Group, GroupInvite } = await getAppDB(appId);
  const email = request.body.email.toLowerCase();
  const invite = await GroupInvite.findOne({ where: { email } });

  assertKoaCondition(invite != null, ctx, 404, 'This invite does not exist');

  const group = await Group.findByPk(invite.GroupId, { attributes: ['id'] });
  assertKoaCondition(group != null, ctx, 404, 'Group not found');

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.DeleteGroupInvites],
  });

  await invite.destroy();
}
