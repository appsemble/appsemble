import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { EmailAuthorization, OrganizationMember, User } from '../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';

export async function addOrganizationMember(ctx: Context): Promise<void> {
  const {
    pathParams: { organizationId },
    request: {
      body: { email, role },
    },
  } = ctx;

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId,
    requiredPermissions: [OrganizationPermission.CreateOrganizationInvites],
  });

  const emailAuthorization = await EmailAuthorization.findOne({
    where: { email: email.toLowerCase() },
    include: [{ model: User }],
  });

  assertKoaCondition(
    emailAuthorization?.User != null,
    ctx,
    404,
    'No account was found for this email address.',
  );

  // Without the invite email as proof of ownership, a verified address is the only thing tying
  // this email address to the account that is about to gain access to the organization.
  assertKoaCondition(
    emailAuthorization.verified,
    ctx,
    400,
    'This email address has not been verified.',
  );

  const user = emailAuthorization.User;

  const existingMember = await OrganizationMember.findOne({
    where: { OrganizationId: organizationId, UserId: user.id },
  });

  assertKoaCondition(
    existingMember == null,
    ctx,
    409,
    'This account is already a member of this organization.',
  );

  await OrganizationMember.create({ OrganizationId: organizationId, UserId: user.id, role });

  ctx.status = 201;
  ctx.body = {
    id: user.id,
    name: user.name,
    primaryEmail: user.primaryEmail,
    role,
  };
}
