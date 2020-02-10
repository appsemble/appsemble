import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';

export default function authentication(
  { host, secret },
  { App, EmailAuthorization, OAuth2ClientCredentials, User },
) {
  return {
    async basic(email, password) {
      const { User: user } = await EmailAuthorization.findOne({
        include: [User],
        where: { email },
      });
      const isValidPassword = await bcrypt.compare(password, user.password);
      return isValidPassword ? user : null;
    },

    async app(accessToken) {
      const { aud, scope, sub } = jwt.verify(accessToken, secret);
      // XXX use origin check when default app domains are implemented.
      const [prefix, id] = aud.split(':');
      if (prefix !== 'app') {
        return null;
      }
      const app = new App({ id });
      return [{ id: sub }, { scope, app }];
    },

    async cli(accessToken) {
      const { aud, scope, sub } = jwt.verify(accessToken, secret);
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
      return [{ id: sub }, { scope }];
    },

    async studio(accessToken) {
      const { sub } = jwt.verify(accessToken, secret, { audience: host });
      return { id: sub };
    },
  };
}
