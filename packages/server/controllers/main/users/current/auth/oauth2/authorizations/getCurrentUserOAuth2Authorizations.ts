import { type Context } from 'koa';

import { OAuthAuthorization } from '../../../../../../../models/index.js';

export async function getCurrentUserOAuth2Authorizations(ctx: Context): Promise<void> {
  const user = ctx.user!;

  ctx.body = await OAuthAuthorization.findAll({
    attributes: ['authorizationUrl'],
    where: { UserId: user.id },
  });
}
