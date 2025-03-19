import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { EmailAuthorization, OAuthAuthorization, type User } from '../../../../../models/index.js';

export async function removeCurrentUserEmail(ctx: Context): Promise<void> {
  const { request, user } = ctx;

  const email = request.body.email.toLowerCase();
  await (user as User).reload({
    include: [
      {
        model: EmailAuthorization,
      },
      {
        model: OAuthAuthorization,
      },
    ],
  });

  const dbEmail = await EmailAuthorization.findOne({ where: { email, UserId: user.id } });

  assertKoaCondition(
    dbEmail != null,
    ctx,
    404,
    'This email address is not associated with your account.',
  );
  assertKoaCondition(
    !(
      (user as User).EmailAuthorizations.length === 1 && !(user as User).OAuthAuthorizations.length
    ),
    ctx,
    406,
    'Deleting this email results in the inability to access this account.',
  );

  await dbEmail.destroy();

  ctx.status = 204;
}
