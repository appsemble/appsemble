import { assertKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { EmailAuthorization, User } from '../../../../models/index.js';

export async function updateCurrentUser(ctx: Context): Promise<void> {
  const {
    request: {
      body: { locale, name, subscribed, timezone },
    },
    user,
  } = ctx;
  const email = ctx.request.body.email?.toLowerCase();

  const dbUser = await User.findOne({
    where: { id: user.id },
    include: [
      {
        model: EmailAuthorization,
      },
    ],
  });

  if (email && email !== dbUser.primaryEmail) {
    const emailAuth = await EmailAuthorization.findOne({
      where: { email },
    });

    assertKoaError(!emailAuth, ctx, 404, 'No matching email could be found.');
    assertKoaError(!emailAuth.verified, ctx, 406, 'This email address has not been verified.');
  }

  await dbUser.update({ name, primaryEmail: email, locale, timezone, subscribed });

  ctx.body = {
    id: dbUser.id,
    name,
    email,
    email_verified: true,
    locale: dbUser.locale,
    subscribed,
  };
}
