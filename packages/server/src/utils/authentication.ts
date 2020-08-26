import type { JwtPayload } from '@appsemble/types';
import { compare } from 'bcrypt';
import { verify } from 'jsonwebtoken';
import type { GetApiKeyUser } from 'koas-security/lib/apiKeySecurityCheck';
import type { GetHttpUser } from 'koas-security/lib/httpSecurityCheck';
import type { GetOAuth2User } from 'koas-security/lib/oauth2SecurityCheck';
import type { OAuth2Client } from 'koas-security/lib/types';
import { Op } from 'sequelize';

import { App, EmailAuthorization, OAuth2ClientCredentials, User } from '../models';
import type { Argv } from '../types';

interface Client extends OAuth2Client {
  app: App;
}

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
    async basic(email, password) {
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
        return null;
      }
      const app = new App({ id });
      return [{ id: sub }, { scope, app }] as [LoggedInUser, Client];
    },

    async cli(accessToken) {
      const { aud, scope, sub } = verify(accessToken, secret) as JwtPayload;
      const credentials = await OAuth2ClientCredentials.findOne({
        attributes: [],
        raw: true,
        where: {
          id: aud,
          expires: { [Op.or]: [null, { [Op.gt]: new Date() }] },
          UserId: sub,
        },
      });
      if (!credentials) {
        return null;
      }
      return [{ id: sub }, { scope }] as [LoggedInUser, Client];
    },

    studio(accessToken) {
      const { sub } = verify(accessToken, secret, { audience: host }) as JwtPayload;
      return { id: sub };
    },
  };
}
