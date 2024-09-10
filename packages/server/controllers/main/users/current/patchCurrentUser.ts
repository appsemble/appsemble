import { type Context } from 'koa';

import { User } from '../../../../models/index.js';
import { getUserInfoById } from '../../../../utils/user.js';

// TODO fix the endpoint for setting a user's primary email
export async function patchCurrentUser(ctx: Context): Promise<void> {
  const {
    request: {
      body: { locale, name, subscribed, timezone },
    },
    user: authSubject,
  } = ctx;

  const user = await User.findByPk(authSubject.id);

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

  await user.update({ name, locale, timezone, subscribed });
  ctx.body = await getUserInfoById(authSubject.id);
}
