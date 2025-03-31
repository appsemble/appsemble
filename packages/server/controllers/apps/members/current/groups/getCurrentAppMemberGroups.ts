import { type AppMemberGroup } from '@appsemble/types';
import { type Context } from 'koa';

import { Group, GroupMember } from '../../../../../models/index.js';
import { checkAppMemberAppPermissions } from '../../../../../utils/authorization.js';

export async function getCurrentAppMemberGroups(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    user: authSubject,
  } = ctx;

  await checkAppMemberAppPermissions({ context: ctx, appId, requiredPermissions: [] });

  const groups = await Group.findAll({
    where: { AppId: appId },
    include: [
      {
        model: GroupMember,
        where: { AppMemberId: authSubject!.id },
        required: true,
      },
    ],
  });

  ctx.body = groups.map((group) => ({
    id: group.id,
    name: group.name,
    role: group.Members[0].role,
  })) as AppMemberGroup[];
}
