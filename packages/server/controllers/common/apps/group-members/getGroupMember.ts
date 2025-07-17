import { AppPermission } from '@appsemble/lang-sdk';
import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { getAppDB } from '../../../../models/index.js';
import { checkAuthSubjectAppPermissions } from '../../../../utils/authorization.js';

export async function getGroupMember(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, groupMemberId },
  } = ctx;
  const { AppMember, GroupMember } = await getAppDB(appId);
  const groupMember = await GroupMember.findByPk(groupMemberId, {
    include: [
      {
        attributes: ['id', 'name', 'email'],
        model: AppMember,
      },
    ],
  });

  assertKoaCondition(groupMember != null, ctx, 404, 'Group member not found.');

  await checkAuthSubjectAppPermissions({
    context: ctx,
    appId,
    requiredPermissions: [AppPermission.QueryGroupMembers],
  });

  ctx.body = {
    id: groupMember.id,
    name: groupMember.AppMember!.name,
    primaryEmail: groupMember.AppMember!.email,
  };
}
