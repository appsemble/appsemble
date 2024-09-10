import { assertKoaError } from '@appsemble/node-utils';
import { Permissions } from '@appsemble/utils';
import { type Context } from 'koa';

import { Organization, OrganizationInvite } from '../../../../models/index.js';
import { checkRole } from '../../../../utils/checkRole.js';

export async function getOrganizationInvites(ctx: Context): Promise<void> {
  const {
    pathParams: { organizationId },
  } = ctx;

  const member = await checkRole(ctx, organizationId, Permissions.InviteMember, {
    include: [
      {
        model: Organization,
        attributes: ['id'],
        required: false,
        include: [OrganizationInvite],
      },
    ],
  });

  assertKoaError(!member.Organization, ctx, 404, 'Organization not found.');

  ctx.body = member.Organization.OrganizationInvites.map(({ email }) => ({
    email,
  }));
}
