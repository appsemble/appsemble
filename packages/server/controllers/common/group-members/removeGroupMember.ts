import { assertKoaError } from '@appsemble/node-utils';
import { AppPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppMember, GroupMember } from '../../../models/index.js';
import { checkAuthSubjectAppPermissions } from '../../../utils/authorization.js';

export async function removeGroupMember(ctx: Context): Promise<void> {
  const {
    pathParams: { groupMemberId },
  } = ctx;

  const groupMember = await GroupMember.findByPk(groupMemberId, {
    include: [
      {
        attributes: ['id'],
        model: AppMember,
        include: [
          {
            attributes: ['id'],
            model: App,
          },
        ],
      },
    ],
  });

  assertKoaError(!groupMember, ctx, 404, 'Group member not found.');

  await checkAuthSubjectAppPermissions(ctx, groupMember.Group.App.id, [
    AppPermission.RemoveGroupMembers,
  ]);

  await groupMember.destroy();
}
