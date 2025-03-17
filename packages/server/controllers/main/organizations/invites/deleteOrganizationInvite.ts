import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { OrganizationInvite } from '../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';

export async function deleteOrganizationInvite(ctx: Context): Promise<void> {
  const { request } = ctx;

  const email = request.body.email.toLowerCase();
  const invite = await OrganizationInvite.findOne({ where: { email } });

  assertKoaCondition(!!invite, ctx, 404, 'This invite does not exist');

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: invite.OrganizationId,
    requiredPermissions: [OrganizationPermission.DeleteOrganizationInvites],
  });

  await invite.destroy();
}
