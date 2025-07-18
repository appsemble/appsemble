import { AppPermission } from '@appsemble/lang-sdk';
import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { AppMember, GroupMember } from '../../../models/index.js';
import { checkAuthSubjectAppPermissions } from '../../../utils/authorization.js';

export async function deleteGroupMember(ctx: Context): Promise<void> {
  const {
    pathParams: { groupMemberId },
    queryParams: { selectedGroupId },
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

  assertKoaCondition(groupMember != null, ctx, 404, 'Group member not found.');

  assertKoaCondition(
    groupMember.AppMember!.id !== authSubject!.id,
    ctx,
    401,
    'Cannot use this endpoint to remove yourself from the group',
  );

  await checkAuthSubjectAppPermissions({
    context: ctx,
    appId: groupMember.AppMember!.AppId,
    requiredPermissions: [AppPermission.RemoveGroupMembers],
    groupId: selectedGroupId,
  });

  await groupMember.destroy();
}
