import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { Organization, OrganizationInvite } from '../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';

export async function getOrganizationInvites(ctx: Context): Promise<void> {
  const {
    pathParams: { organizationId },
  } = ctx;

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId,
    requiredPermissions: [OrganizationPermission.QueryOrganizationInvites],
  });

  const organization = await Organization.findByPk(organizationId);

  assertKoaCondition(organization != null, ctx, 404, 'Organization not found.');

  const organizationInvites = await OrganizationInvite.findAll({
    where: {
      OrganizationId: organizationId,
    },
  });

  ctx.body = organizationInvites.map(({ email }) => ({
    email,
  }));
}
