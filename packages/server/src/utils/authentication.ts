import type { JwtPayload } from '@appsemble/types';
import { compare } from 'bcrypt';
import { verify } from 'jsonwebtoken';
import type { GetApiKeyUser, GetHttpUser, GetOAuth2User } from 'koas-security';
import { Op } from 'sequelize';

import { App, EmailAuthorization, OAuth2ClientCredentials, User } from '../models';
import type { Argv } from '../types';

interface LoggedInUser {
  id: string | number;
}

interface AuthenticationCheckers {
  basic: GetHttpUser<User>;
  app: GetOAuth2User<LoggedInUser>;
  cli: GetOAuth2User<LoggedInUser>;
  studio: GetApiKeyUser<LoggedInUser>;
}

export function authentication({ host, secret }: Argv): AuthenticationCheckers {
  return {
    async basic(email: string, password: string) {
      const { User: user } = await EmailAuthorization.findOne({
        include: [User],
        where: { email },
      });
      const isValidPassword = await compare(password, user.password);
      return isValidPassword ? user : null;
    },

    app(accessToken) {
      const { aud, scope, sub } = verify(accessToken, secret) as JwtPayload;
      // XXX use origin check when default app domains are implemented.
      const [prefix, id] = aud.split(':');
      if (prefix !== 'app') {
        return;
      }
      const app = new App({ id });
      return [new User({ id: sub }), { scope, app }];
    },

    async cli(accessToken) {
      const { aud, scope, sub } = verify(accessToken, secret) as JwtPayload;
      const credentials = await OAuth2ClientCredentials.count({
        where: {
          id: aud,
          expires: { [Op.or]: [null, { [Op.gt]: new Date() }] },
          UserId: sub,
        },
      });
      if (!credentials) {
        return;
      }
      return [new User({ id: sub }), { scope }];
    },

    studio(accessToken) {
      const { sub } = verify(accessToken, secret, { audience: host }) as JwtPayload;
      return new User({ id: sub });
    },
  };
}
