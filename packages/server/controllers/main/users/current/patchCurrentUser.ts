import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { EmailAuthorization, User } from '../../../../models/index.js';
import { getUserInfoById } from '../../../../utils/user.js';

// TODO fix the endpoint for setting a user's primary email
export async function patchCurrentUser(ctx: Context): Promise<void> {
  const {
    request: {
      body: { email, locale, name, subscribed, timezone },
    },
    user: authSubject,
  } = ctx;

  const user = await User.findByPk(authSubject.id, { include: [EmailAuthorization] });

  const result: Partial<User> = {};

  if (name != null) {
    result.name = name;
  }

  if (locale) {
    result.locale = locale;
  }

  if (subscribed) {
    result.subscribed = subscribed;
  }

  if (timezone) {
    result.subscribed = timezone;
  }

  if (email && email !== user.primaryEmail) {
    const emailAuth = await EmailAuthorization.findOne({ where: { email } });
    assertKoaCondition(emailAuth != null, ctx, 404, 'No matching email could be found.');
    assertKoaCondition(emailAuth.verified, ctx, 406, 'This email address has not been verified.');
  }

  await user.update({ primaryEmail: email, name, locale, timezone, subscribed });
  ctx.body = await getUserInfoById(authSubject.id);
}
