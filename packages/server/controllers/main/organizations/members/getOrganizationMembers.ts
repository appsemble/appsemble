import { assertKoaError } from '@appsemble/node-utils';
import { MainPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { Organization, User } from '../../../../models/index.js';
import { checkUserPermissions } from '../../../../utils/authorization.js';

export async function getOrganizationMembers(ctx: Context): Promise<void> {
  const {
    pathParams: { organizationId },
  } = ctx;

  const organization = await Organization.findByPk(organizationId, {
    include: [User],
  });

  assertKoaError(!organization, ctx, 404, 'Organization not found.');

  await checkUserPermissions(ctx, organization.id, [MainPermission.QueryOrganizationMembers]);

  ctx.body = organization.Users.map((user) => ({
    id: user.id,
    name: user.name,
    primaryEmail: user.primaryEmail,
    role: user.OrganizationMember.role,
  }));
}
