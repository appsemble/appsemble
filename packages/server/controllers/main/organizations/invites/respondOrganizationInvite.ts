import { assertKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { Organization, OrganizationInvite } from '../../../../models/index.js';

export async function respondOrganizationInvite(ctx: Context): Promise<void> {
  const {
    pathParams: { organizationId },
    request: {
      body: { response, token },
    },
    user: { id: userId },
  } = ctx;

  const invite = await OrganizationInvite.findOne({ where: { key: token } });

  assertKoaError(!invite, ctx, 404, 'This token is invalid');

  const organization = await Organization.findByPk(invite.OrganizationId);

  assertKoaError(organizationId !== organization.id, ctx, 406, 'Organization IDs do not match');

  if (response) {
    await organization.$add('User', userId, { through: { role: invite.role } });
  }

  await invite.destroy();
}
