import { assertKoaError } from '@appsemble/node-utils';
import { MainPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { Organization, OrganizationInvite } from '../../../../models/index.js';
import { checkUserPermissions } from '../../../../utils/authorization.js';

export async function getOrganizationInvites(ctx: Context): Promise<void> {
  const {
    pathParams: { organizationId },
  } = ctx;

  await checkUserPermissions(ctx, organizationId, [MainPermission.QueryOrganizationInvites]);

  const organization = await Organization.findByPk(organizationId);

  assertKoaError(!organization, ctx, 404, 'Organization not found.');

  const organizationInvites = await OrganizationInvite.findAll({
    where: {
      OrganizationId: organizationId,
    },
  });

  ctx.body = organizationInvites.map(({ email }) => ({
    email,
  }));
}
