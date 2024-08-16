import { assertKoaError } from '@appsemble/node-utils';
import { AppPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { AppMember, GroupMember } from '../../../models/index.js';
import { checkAuthSubjectAppPermissions } from '../../../utils/authorization.js';

export async function deleteGroupMember(ctx: Context): Promise<void> {
  const {
    pathParams: { groupMemberId },
    user: authSubject,
  } = ctx;

  const groupMember = await GroupMember.findByPk(groupMemberId, {
    include: [
      {
        attributes: ['id', 'AppId'],
        model: AppMember,
      },
    ],
  });

  assertKoaError(!groupMember, ctx, 404, 'Group member not found.');

  assertKoaError(
    groupMember.AppMemberId === authSubject.id,
    ctx,
    401,
    'Cannot use this endpoint to remove yourself from the group',
  );

  await checkAuthSubjectAppPermissions({
    context: ctx,
    appId: groupMember.AppMember.AppId,
    groupId: groupMember.GroupId,
    requiredPermissions: [AppPermission.RemoveGroupMembers],
  });

  await groupMember.destroy();
}
