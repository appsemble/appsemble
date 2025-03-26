import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { Organization, User } from '../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';

export async function updateOrganizationMemberRole(ctx: Context): Promise<void> {
  const {
    pathParams: { organizationId, organizationMemberId },
    request: {
      body: { role },
    },
  } = ctx;

  const user = ctx.user!;

  const organization = await Organization.findByPk(organizationId, { include: [User] });

  assertKoaCondition(
    organization.Users.some((u) => u.id === user.id),
    ctx,
    404,
    'User is not a member of this organization.',
  );
  assertKoaCondition(
    user.id !== organizationMemberId,
    ctx,
    400,
    'Not allowed to change your own rule',
  );

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: organization.id,
    requiredPermissions: [OrganizationPermission.UpdateOrganizationMemberRoles],
  });

  const member = organization.Users.find((m) => m.id === organizationMemberId);

  assertKoaCondition(member != null, ctx, 400, 'This member is not part of this organization.');

  // XXX: how is OrganizationMember loaded? Sequelize doesn't allow to use it with `include`, yet it
  // works without including it in the User model. How?
  await member.OrganizationMember!.update({ role });
  ctx.body = {
    id: member.id,
    role,
    name: member.name,
    primaryEmail: member.primaryEmail,
  };
}
