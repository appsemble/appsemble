import { assertKoaError } from '@appsemble/node-utils';
import { MainPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { Organization, User } from '../../../../models/index.js';
import { checkUserPermissions } from '../../../../utils/authorization.js';

export async function removeOrganizationMember(ctx: Context): Promise<void> {
  const {
    pathParams: { memberId, organizationId },
    user,
  } = ctx;

  const organization = await Organization.findByPk(organizationId, { include: [User] });

  assertKoaError(
    !organization.Users.some((u) => u.id === user.id),
    ctx,
    404,
    'User is not part of this organization.',
  );

  assertKoaError(
    !organization.Users.some((u) => u.id === memberId),
    ctx,
    404,
    'This member is not part of this organization.',
  );

  if (memberId !== user.id) {
    await checkUserPermissions(ctx, organization.id, [MainPermission.RemoveOrganizationMembers]);
  }

  assertKoaError(
    memberId === user.id && organization.Users.length <= 1,
    ctx,
    406,
    'Not allowed to remove yourself from an organization if you’re the only member left.',
  );

  await organization.$remove('User', memberId);
}
