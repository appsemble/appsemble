import { type Context } from 'koa';

import { OrganizationSsoIdentity } from '../../../../../../../models/index.js';

export async function getCurrentUserOidcIdentities(ctx: Context): Promise<void> {
  ctx.set('Cache-Control', 'private, no-store');
  ctx.body = await OrganizationSsoIdentity.findAll({
    attributes: ['id', 'issuer', 'subject'],
    where: { UserId: ctx.user!.id },
    order: [
      ['issuer', 'ASC'],
      ['subject', 'ASC'],
    ],
  });
}
