import { type AuthSubject, type SecurityOptions } from '@appsemble/node-utils';
import { type App as AppType } from '@appsemble/types';
import { compare } from 'bcrypt';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { Op } from 'sequelize';

import { AppWebhookSecret } from '../models/AppWebhookSecret.js';
import {
  App,
  AppMember,
  EmailAuthorization,
  OAuth2ClientCredentials,
  User,
} from '../models/index.js';
import { argv } from '../utils/argv.js';
import { decrypt } from '../utils/crypto.js';

export function authentication(): SecurityOptions {
  const { host, secret } = argv;

  return {
    async basic(email: string, password: string) {
      const { User: user } = await EmailAuthorization.findOne({
        include: [
          {
            model: User,
            attributes: ['id', 'password'],
          },
        ],
        where: { email: email.toLowerCase() },
      });

      const isValidPassword = await compare(password, user.password);

      if (isValidPassword) {
        return user;
      }

      return null;
    },

    async app(accessToken: string) {
      const { aud, scope, sub } = jwt.verify(accessToken, secret) as JwtPayload;
      // XXX use origin check when default app domains are implemented.
      const [prefix, id] = (aud as string).split(':');

      if (prefix !== 'app') {
        return;
      }

      const app = (await App.findByPk(id)).toJSON();

      const appMember = await AppMember.findByPk(sub, {
        attributes: ['id'],
      });

      const result: [AuthSubject, { scope: string; app: AppType }] = [appMember, { scope, app }];
      return result;
    },

    async cli(accessToken: string) {
      const { aud, scope, sub } = jwt.verify(accessToken, secret) as JwtPayload;
      const credentials = await OAuth2ClientCredentials.count({
        where: {
          id: aud,
          expires: { [Op.or]: [null, { [Op.gt]: new Date() }] },
          UserId: sub,
        },
      });

      const user = await User.findByPk(sub, {
        attributes: ['id'],
      });

      if (!credentials) {
        return;
      }

      const result: [AuthSubject, { scope: string }] = [user, { scope }];
      return result;
    },

    async scim(scimToken: string, { path }: { path: string }) {
      // This runs before the path parameter parsing, so we can’t use pathParams
      const match = path.match(/^\/api\/apps\/(\d+)\/scim/);
      if (!match) {
        return;
      }

      const app = await App.findOne({
        where: {
          id: Number(match[1]),
          scimEnabled: true,
        },
        attributes: ['id', 'scimToken'],
      });

      if (decrypt(app.scimToken, argv.aesSecret) === scimToken) {
        return {} as User;
      }
    },

    studio(accessToken: string) {
      const { sub } = jwt.verify(accessToken, secret, { audience: host }) as JwtPayload;
      return User.findByPk(sub, {
        attributes: ['id'],
      });
    },

    async webhook(webhookToken: string, { path }: { path: string }) {
      const match = path.match(/^\/api\/apps\/(\d+)\/webhooks\/(.+)$/);
      if (!match) {
        return;
      }

      const appWebhookSecrets = await AppWebhookSecret.findAll({
        where: {
          AppId: Number(match[1]),
          webhookName: match[2],
        },
        attributes: ['secret'],
      });

      const webhookSecret = appWebhookSecrets.find(
        (whSecret) =>
          decrypt(whSecret.secret, argv.aesSecret) ===
          decrypt(Buffer.from(webhookToken, 'hex'), argv.aesSecret),
      );

      if (webhookSecret) {
        return {} as AppMember;
      }
    },
  };
}
