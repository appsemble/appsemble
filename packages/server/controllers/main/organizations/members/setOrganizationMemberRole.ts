import { assertKoaError } from '@appsemble/node-utils';
import { Permission } from '@appsemble/utils';
import { type Context } from 'koa';

import { Organization, User } from '../../../../models/index.js';
import { checkRole } from '../../../../utils/checkRole.js';

export async function setOrganizationMemberRole(ctx: Context): Promise<void> {
  const {
    pathParams: { memberId, organizationId },
    request: {
      body: { role },
    },
    user,
  } = ctx;

  const organization = await Organization.findByPk(organizationId, { include: [User] });

  assertKoaError(
    !organization.Users.some((u) => u.id === user.id),
    ctx,
    404,
    'User is not part of this organization.',
  );
  assertKoaError(user.id === memberId, ctx, 400, 'Not allowed to change your own rule');

  await checkRole(ctx, organization.id, Permission.ManageRoles);

  const member = organization.Users.find((m) => m.id === memberId);

  assertKoaError(!member, ctx, 400, 'This member is not part of this organization.');

  await member.OrganizationMember.update({ role });
  ctx.body = {
    id: member.id,
    role,
    name: member.name,
    primaryEmail: member.primaryEmail,
  };
}
