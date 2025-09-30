import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App, getAppDB } from '../../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../../utils/authorization.js';

export async function getGroupInvites(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, groupId },
  } = ctx;
  const { Group, GroupInvite } = await getAppDB(appId);
  const app = await App.findByPk(appId, { attributes: ['OrganizationId'] });
  assertKoaCondition(app != null, ctx, 404, 'App not found.');

  const group = await Group.findByPk(groupId, { attributes: ['id'] });
  assertKoaCondition(group != null, ctx, 404, 'Group not found.');

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.QueryGroupInvites],
  });

  const groupInvites = await GroupInvite.findAll({
    where: { GroupId: groupId },
  });

  ctx.body = groupInvites.map(({ email, role }) => ({
    email,
    role,
  }));
}
