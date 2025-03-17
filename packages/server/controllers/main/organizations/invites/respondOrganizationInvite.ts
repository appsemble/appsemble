import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { OrganizationInvite, OrganizationMember } from '../../../../models/index.js';

export async function respondOrganizationInvite(ctx: Context): Promise<void> {
  const {
    pathParams: { token },
    request: {
      body: { response },
    },
    user: { id: userId },
  } = ctx;

  const invite = await OrganizationInvite.findOne({
    where: { key: token },
  });

  assertKoaCondition(!!invite, ctx, 404, 'This token is invalid');

  if (response) {
    await OrganizationMember.create({
      OrganizationId: invite.OrganizationId,
      UserId: userId,
      role: invite.role,
    });
  }

  await invite.destroy();
}
