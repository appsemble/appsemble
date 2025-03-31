import { assertKoaCondition } from '@appsemble/node-utils';
import { type GroupInvite as GroupInviteType } from '@appsemble/types';
import { type Context } from 'koa';

import { Group, GroupInvite } from '../../../models/index.js';

export async function getGroupInvite(ctx: Context): Promise<void> {
  const {
    pathParams: { token },
  } = ctx;

  const invite = await GroupInvite.findOne({
    attributes: ['email', 'role'],
    where: { key: token },
    include: [
      {
        attributes: ['name'],
        model: Group,
      },
    ],
  });

  assertKoaCondition(invite != null, ctx, 404, `No invite found for token: ${token}`);

  ctx.body = {
    groupId: invite.GroupId,
    groupName: invite.Group!.name,
    email: invite.email,
    role: invite.role,
  } as GroupInviteType;
}
