import { assertKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { AppMember, Group, GroupInvite, GroupMember } from '../../../models/index.js';

export async function respondGroupInvite(ctx: Context): Promise<void> {
  const {
    pathParams: { token },
    request: {
      body: { response },
    },
  } = ctx;

  const invite = await GroupInvite.findOne({
    where: { key: token },
  });

  assertKoaError(!invite, ctx, 404, 'This token is invalid');

  if (response) {
    const existingGroupMember = await GroupMember.findOne({
      include: [
        {
          attributes: ['email'],
          model: AppMember,
          where: { email: invite.email },
          required: true,
        },
        {
          attributes: ['id'],
          model: Group,
          where: { id: invite.GroupId },
          required: true,
        },
      ],
    });

    assertKoaError(
      Boolean(existingGroupMember),
      ctx,
      409,
      'Group member with this email already exists in this group',
    );

    const appMember = await AppMember.findOne({
      attributes: ['id'],
      where: { email: invite.email },
    });

    await GroupMember.create({
      AppMemberId: appMember.id,
      GroupId: invite.GroupId,
      role: invite.role,
    });
  }

  await invite.destroy();
}
