import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App, Group, GroupInvite } from '../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';

export async function getGroupInvites(ctx: Context): Promise<void> {
  const {
    pathParams: { groupId },
  } = ctx;

  const group = await Group.findByPk(groupId, {
    attributes: ['id'],
    include: [
      {
        attributes: ['OrganizationId'],
        model: App,
      },
    ],
  });

  assertKoaCondition(group != null, ctx, 404, 'Group not found.');

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: group.App!.OrganizationId,
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
