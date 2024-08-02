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
    include: [
      {
        attributes: ['id'],
        model: Group,
      },
    ],
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
      ],
    });

    assertKoaError(
      Boolean(existingGroupMember),
      ctx,
      409,
      'Group member with this email already exists',
    );

    const appMember = await AppMember.findOne({
      attributes: ['id'],
      where: { email: invite.email },
    });

    await GroupMember.create({
      AppMemberId: appMember.id,
      GroupId: invite.Group.id,
      role: invite.role,
    });
  }

  await invite.destroy();
}
