import { type UserInfo } from '@appsemble/types';

import { getGravatarUrl } from './gravatar.js';
import { EmailAuthorization, User } from '../models/index.js';

export async function getUserInfoById(id: string): Promise<UserInfo> {
  const user = await User.findByPk(id);

  const userEmailAuthorizations = await EmailAuthorization.findAll({
    where: {
      UserId: user.id,
    },
  });

  return {
    sub: user.id,
    name: user.name,
    email: user.primaryEmail,
    email_verified: Boolean(
      userEmailAuthorizations.some(
        (emailAuthorization) =>
          emailAuthorization.email === user.primaryEmail && emailAuthorization.verified === true,
      ),
    ),
    // @ts-expect-error 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    picture: getGravatarUrl(user.primaryEmail),
    locale: user.locale,
    zoneinfo: user.timezone,
    subscribed: user.subscribed,
    hasPassword: Boolean(user.password != null),
  } as UserInfo;
}
