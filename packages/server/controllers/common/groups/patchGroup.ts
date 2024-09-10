import { assertKoaError } from '@appsemble/node-utils';
import { AppPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { Group, GroupMember } from '../../../models/index.js';
import { checkAuthSubjectAppPermissions } from '../../../utils/authorization.js';

export async function patchGroup(ctx: Context): Promise<void> {
  const {
    pathParams: { groupId },
    request: {
      body: { annotations, name },
    },
  } = ctx;

  const group = await Group.findByPk(groupId);

  assertKoaError(!group, ctx, 404, 'Group not found');

  const appMember = await checkAuthSubjectAppPermissions(ctx, group.AppId, [
    AppPermission.UpdateGroups,
  ]);

  await group.update({ name: name || undefined, annotations: annotations || undefined });

  let groupMember;
  if (appMember) {
    groupMember = await GroupMember.findOne({
      where: { AppMemberId: appMember.id },
    });
  }

  ctx.body = {
    id: group.id,
    role: groupMember?.role,
    name,
    ...(annotations && { annotations }),
  };
}
