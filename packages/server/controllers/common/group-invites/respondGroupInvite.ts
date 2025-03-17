import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { AppMember, Group, GroupInvite, GroupMember } from '../../../models/index.js';

export async function respondGroupInvite(ctx: Context): Promise<void> {
  const {
    pathParams: { token },
    request: {
      body: { response },
    },
    user: authSubject,
  } = ctx;

  const invite = await GroupInvite.findOne({
    where: { key: token },
  });

  assertKoaCondition(!!invite, ctx, 404, 'This token is invalid');

  const authenticatedAppMember = await AppMember.findByPk(authSubject.id, {
    attributes: ['email'],
  });

  assertKoaCondition(
    authenticatedAppMember.email === invite.email,
    ctx,
    401,
    'The emails of the group invite and the authenticated app member do not match',
  );

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

    assertKoaCondition(
      !existingGroupMember,
      ctx,
      409,
      'Group member with this email already exists in this group',
    );

    const appMember = await AppMember.findOne({
      attributes: ['id'],
      where: { email: invite.email },
    });

    assertKoaCondition(!!appMember, ctx, 400, 'The invited email is not a member of the app');

    await GroupMember.create({
      AppMemberId: appMember.id,
      GroupId: invite.GroupId,
      role: invite.role,
    });
  }

  await invite.destroy();
}
