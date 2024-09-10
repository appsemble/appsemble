import { assertKoaError } from '@appsemble/node-utils';
import { Permission } from '@appsemble/utils';
import { type Context } from 'koa';

import { OrganizationInvite } from '../../../../models/index.js';
import { checkRole } from '../../../../utils/checkRole.js';

export async function deleteOrganizationInvite(ctx: Context): Promise<void> {
  const { request } = ctx;

  const email = request.body.email.toLowerCase();
  const invite = await OrganizationInvite.findOne({ where: { email } });

  assertKoaError(!invite, ctx, 404, 'This invite does not exist');

  await checkRole(ctx, invite.OrganizationId, Permission.InviteMember);

  await invite.destroy();
}
