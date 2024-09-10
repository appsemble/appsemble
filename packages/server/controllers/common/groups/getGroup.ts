import { assertKoaError } from '@appsemble/node-utils';
import { AppPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { Group, GroupMember } from '../../../models/index.js';
import { checkAuthSubjectAppPermissions } from '../../../utils/authorization.js';

export async function getGroup(ctx: Context): Promise<void> {
  const {
    pathParams: { groupId },
  } = ctx;

  const group = await Group.findByPk(groupId);

  assertKoaError(!group, ctx, 404, 'Group not found');

  const appMember = await checkAuthSubjectAppPermissions(ctx, group.AppId, [
    AppPermission.QueryGroups,
  ]);

  let groupMember;
  if (appMember) {
    groupMember = await GroupMember.findOne({
      where: {
        AppMemberId: appMember.id,
      },
    });
  }

  ctx.body = {
    id: group.id,
    name: group.name,
    role: groupMember?.role,
    ...(group.annotations && { annotations: group.annotations }),
  };
}
