import { assertKoaCondition } from '@appsemble/node-utils';
import { AppPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { getAppDB } from '../../../../models/index.js';
import { checkAuthSubjectAppPermissions } from '../../../../utils/authorization.js';

export async function deleteGroupMember(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, groupMemberId },
    queryParams: { selectedGroupId },
    user: authSubject,
  } = ctx;
  const { AppMember, GroupMember } = await getAppDB(appId);
  const groupMember = await GroupMember.findByPk(groupMemberId, {
    include: [
      {
        attributes: ['id'],
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
    appId,
    requiredPermissions: [AppPermission.RemoveGroupMembers],
    groupId: selectedGroupId,
  });

  await groupMember.destroy();
}
