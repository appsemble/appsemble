import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { getDB, Organization, OrganizationMember, User } from '../../../../models/index.js';
import {
  checkOrganizationOwnerRemoval,
  checkUserOrganizationPermissions,
} from '../../../../utils/authorization.js';
import { getOrganizationMemberAccess } from '../../../../utils/organizationSso.js';

export async function removeOrganizationMember(ctx: Context): Promise<void> {
  const {
    pathParams: { organizationId, organizationMemberId },
  } = ctx;

  const user = ctx.user!;

  const organization = await Organization.findByPk(organizationId, { include: [User] });

  assertKoaCondition(organization != null, ctx, 404, 'Organization not found');

  assertKoaCondition(
    organization.Users.some((u) => u.id === user.id),
    ctx,
    404,
    'User is not a member of this organization.',
  );
  const targetUser = organization.Users.find(({ id }) => id === organizationMemberId);
  assertKoaCondition(targetUser != null, ctx, 404, 'This member is not part of this organization.');

  if (organizationMemberId === user.id) {
    const membership = await getOrganizationMemberAccess(ctx, organizationId);
    assertKoaCondition(membership != null, ctx, 403, 'User is not a member of this organization.');
  } else {
    await checkUserOrganizationPermissions({
      context: ctx,
      organizationId: organization.id,
      requiredPermissions: [OrganizationPermission.RemoveOrganizationMembers],
    });
  }

  await getDB().transaction(async (transaction) => {
    await Organization.findByPk(organizationId, {
      attributes: ['id'],
      lock: transaction.LOCK.UPDATE,
      transaction,
    });
    const target = await OrganizationMember.findOne({
      where: { OrganizationId: organizationId, UserId: targetUser.id, serviceAccount: false },
      transaction,
    });
    assertKoaCondition(target != null, ctx, 404, 'This member is not part of this organization.');
    if (organizationMemberId === user.id) {
      const members = await OrganizationMember.count({
        where: { OrganizationId: organizationId },
        transaction,
      });
      assertKoaCondition(
        members > 1,
        ctx,
        406,
        "Not allowed to remove yourself from an organization if you're the only member left.",
      );
    }
    await checkOrganizationOwnerRemoval(ctx, target, null, transaction);
    await target.destroy({ transaction });
  });
}
