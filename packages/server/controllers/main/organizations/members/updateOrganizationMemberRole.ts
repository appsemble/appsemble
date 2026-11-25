import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import {
  getDB,
  Organization,
  OrganizationMember,
  OrganizationSso,
  User,
} from '../../../../models/index.js';
import {
  checkOrganizationOwnerRemoval,
  checkUserOrganizationPermissions,
} from '../../../../utils/authorization.js';
import { getOrganizationMemberRoles } from '../../../../utils/organizationSso.js';

export async function updateOrganizationMemberRole(ctx: Context): Promise<void> {
  const {
    pathParams: { organizationId, organizationMemberId },
    request: {
      body: { guest, role },
    },
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

  const membership = await getDB().transaction(async (transaction) => {
    await Organization.findByPk(organizationId, {
      attributes: ['id'],
      lock: transaction.LOCK.UPDATE,
      transaction,
    });
    const target = await OrganizationMember.findOne({
      where: {
        OrganizationId: organizationId,
        UserId: organizationMemberId,
        serviceAccount: false,
      },
      transaction,
    });
    assertKoaCondition(target != null, ctx, 400, 'This member is not part of this organization.');
    const sso = await OrganizationSso.findByPk(organizationId, { transaction });
    assertKoaCondition(
      target.role != null || guest === true,
      ctx,
      409,
      'Group-managed staff roles are set by the identity provider.',
    );
    assertKoaCondition(
      guest !== true || sso?.policy !== 'required',
      ctx,
      409,
      'This organization requires staff single sign-on for every member.',
    );
    const assignment = {
      role,
      guest: guest ?? target.guest,
      ssoRoles: guest === true ? [] : target.ssoRoles,
    };
    await checkOrganizationOwnerRemoval(ctx, target, assignment, transaction);
    return target.update(assignment, { transaction });
  });
  ctx.body = {
    id: member.id,
    role,
    roles: getOrganizationMemberRoles(membership),
    ssoRoles: membership.ssoRoles,
    guest: membership.guest,
    name: member.name,
    primaryEmail: member.primaryEmail,
  };
}
