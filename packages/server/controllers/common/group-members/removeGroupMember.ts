import { assertKoaError } from '@appsemble/node-utils';
import { GroupPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { GroupMember } from '../../../models/index.js';
import { checkAuthSubjectGroupPermissions } from '../../../utils/authorization.js';

export async function removeGroupMember(ctx: Context): Promise<void> {
  const {
    pathParams: { groupMemberId },
  } = ctx;

  const groupMember = await GroupMember.findByPk(groupMemberId);

  assertKoaError(!groupMember, ctx, 404, 'Group member not found.');

  await checkAuthSubjectGroupPermissions(ctx, groupMember.GroupId, [GroupPermission.RemoveGroupMembers]);

  await groupMember.destroy();
}
