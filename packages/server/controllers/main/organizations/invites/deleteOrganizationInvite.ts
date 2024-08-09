import { assertKoaError } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { OrganizationInvite } from '../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';

export async function deleteOrganizationInvite(ctx: Context): Promise<void> {
  const { request } = ctx;

  const email = request.body.email.toLowerCase();
  const invite = await OrganizationInvite.findOne({ where: { email } });

  assertKoaError(!invite, ctx, 404, 'This invite does not exist');

  await checkUserOrganizationPermissions(ctx, invite.OrganizationId, [
    OrganizationPermission.DeleteOrganizationInvites,
  ]);

  await invite.destroy();
}
