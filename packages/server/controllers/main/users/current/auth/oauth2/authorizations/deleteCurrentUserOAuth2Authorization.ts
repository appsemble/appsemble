import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { OAuthAuthorization, User } from '../../../../../../../models/index.js';

export async function deleteCurrentUserOAuth2Authorization(ctx: Context): Promise<void> {
  const {
    query: { authorizationUrl },
  } = ctx;

  const user = ctx.user!;

  const rows = await OAuthAuthorization.destroy({ where: { UserId: user.id, authorizationUrl } });

  assertKoaCondition(rows > 0, ctx, 404, 'OAuth2 account to unlink not found');

  const dbUser = (await User.findOne({
    attributes: ['password'],
    where: { id: user.id },
    include: [OAuthAuthorization],
  }))!;

  // Return false if any login method is left
  // 201 is needed so that a body can be attatched

  ctx.message = 'The account was unlinked successfully.';
  ctx.status = 204;

  if (dbUser.OAuthAuthorizations.length === 0 && !dbUser.password) {
    ctx.status = 201;
    ctx.body = dbUser.OAuthAuthorizations.length === 0 && !dbUser.password;
  }
}
