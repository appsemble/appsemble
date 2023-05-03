import { type AuthenticationCheckers } from '@appsemble/node-utils';
import { compare } from 'bcrypt';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { Op } from 'sequelize';

import { argv } from './argv.js';
import { App, EmailAuthorization, OAuth2ClientCredentials, User } from '../models/index.js';

export function authentication(): AuthenticationCheckers {
  const { host, secret } = argv;

  return {
    async basic(email: string, password: string) {
      const { User: user } = await EmailAuthorization.findOne({
        include: [User],
        where: { email: email.toLowerCase() },
      });
      const isValidPassword = await compare(password, user.password);
      return isValidPassword ? user : null;
    },

    app(accessToken: string) {
      const { aud, scope, sub } = jwt.verify(accessToken, secret) as JwtPayload;
      // XXX use origin check when default app domains are implemented.
      const [prefix, id] = (aud as string).split(':');
      if (prefix !== 'app') {
        return;
      }
      const app = new App({ id });
      return [new User({ id: sub }), { scope, app }];
    },

    async cli(accessToken) {
      const { aud, scope, sub } = jwt.verify(accessToken, secret) as JwtPayload;
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
      const { sub } = jwt.verify(accessToken, secret, { audience: host }) as JwtPayload;
      return new User({ id: sub });
    },
  };
}
