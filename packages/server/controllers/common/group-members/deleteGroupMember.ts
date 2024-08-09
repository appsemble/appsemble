import { assertKoaError } from '@appsemble/node-utils';
import { AppPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { AppMember, GroupMember } from '../../../models/index.js';
import { checkAuthSubjectAppPermissions } from '../../../utils/authorization.js';

export async function deleteGroupMember(ctx: Context): Promise<void> {
  const {
    pathParams: { groupMemberId },
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

  await checkAuthSubjectAppPermissions(ctx, groupMember.AppMember.AppId, [
    AppPermission.RemoveGroupMembers,
  ]);

  await groupMember.destroy();
}
