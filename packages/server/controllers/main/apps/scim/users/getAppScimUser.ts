import { scimAssert } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { getAppDB } from '../../../../../models/index.js';
import { convertAppMemberToScimUser } from '../../../../../utils/scim.js';

export async function getAppScimUser(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, userId },
  } = ctx;
  const { AppMember, Group, GroupMember } = await getAppDB(appId);
  const member = await AppMember.findOne({
    where: { id: userId },
    include: [
      {
        model: GroupMember,
        include: [
          {
            model: Group,
            required: false,
          },
        ],
      },
    ],
  });
  scimAssert(member, ctx, 404, 'User not found');

  ctx.body = convertAppMemberToScimUser(appId, member);
}
