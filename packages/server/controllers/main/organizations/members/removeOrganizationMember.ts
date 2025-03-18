import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { Organization, User } from '../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';

export async function removeOrganizationMember(ctx: Context): Promise<void> {
  const {
    pathParams: { organizationId, organizationMemberId },
    user,
  } = ctx;

  const organization = await Organization.findByPk(organizationId, { include: [User] });

  assertKoaCondition(
    organization.Users.some((u) => u.id === user.id),
    ctx,
    404,
    'User is not a member of this organization.',
  );

  assertKoaCondition(
    organization.Users.some((u) => u.id === organizationMemberId),
    ctx,
    404,
    'This member is not part of this organization.',
  );

  if (organizationMemberId !== user.id) {
    await checkUserOrganizationPermissions({
      context: ctx,
      organizationId: organization.id,
      requiredPermissions: [OrganizationPermission.RemoveOrganizationMembers],
    });
  }

  assertKoaCondition(
    !(organizationMemberId === user.id && organization.Users.length <= 1),
    ctx,
    406,
    'Not allowed to remove yourself from an organization if you’re the only member left.',
  );

  await organization.$remove('User', organizationMemberId);
}
