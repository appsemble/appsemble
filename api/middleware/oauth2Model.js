import crypto from 'crypto';

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const secret = process.env.OAUTH_SECRET || 'appsemble';

function generateToken(client, user, scope, expiresIn) {
  return jwt.sign(
    {
      scopes: scope,
      client_id: client.id,
    },
    secret,
    {
      issuer: 'appsemble-api',
      subject: `${user.id}`,
      ...(expiresIn && { expiresIn }),
    },
  );
}

export default function oauth2Model(db) {
  return {
    async generateAccessToken(client, user, scope) {
      return generateToken(client, user, scope, 10800); // expires in 3 hours
    },

    async generateRefreshToken() {
      return crypto.randomBytes(40).toString('hex');
    },

    async getAccessToken(accessToken) {
      const { OAuthAuthorization } = await db;
      const token = await OAuthAuthorization.find({ where: { token: accessToken } });

      if (!token) {
        return null;
      }

      try {
        const payload = jwt.verify(accessToken, secret);
        return {
          accessToken,
          accessTokenExpiresAt: new Date(payload.exp * 1000),
          scope: payload.scopes,
          client: { id: payload.client_id },
          user: { id: payload.sub },
        };
      } catch (err) {
        return null;
      }
    },

    async getRefreshToken(refreshToken) {
      const { OAuthAuthorization } = await db;
      const token = await OAuthAuthorization.find({ where: { refreshToken } });

      if (!token) {
        return null;
      }

      try {
        const dec = jwt.verify(refreshToken, secret);
        return {
          refreshToken,
          scope: dec.scopes,
          client: { id: dec.client_id },
          user: { id: dec.sub },
        };
      } catch (err) {
        return null;
      }
    },

    async getClient(clientId, clientSecret) {
      const { OAuthClient } = await db;

      const clause = clientSecret ? { clientId, clientSecret } : { clientId };
      const client = await OAuthClient.find({ where: clause });

      if (!client) {
        return false;
      }

      return {
        id: client.clientId,
        secret: client.clientSecret,
        redirect_uris: [client.redirectUri],
        grants: ['password', 'refresh_token'],
      };
    },

    async getUser(username, password) {
      const { EmailAuthorization } = await db;
      const user = await EmailAuthorization.find({ where: { email: username } }, { raw: true });

      if (!(user || bcrypt.compareSync(password, user.password))) {
        return false;
      }

      return { id: user.UserId, verified: user.verified, email: user.email, name: user.name };
    },

    async saveToken(token, client, user) {
      const { OAuthAuthorization } = await db;

      await OAuthAuthorization.create({
        token: token.accessToken,
        refreshToken: token.refreshToken,
        UserId: user.id,
      });

      return {
        ...token,
        user,
        client,
      };
    },

    async revokeToken(token) {
      const { OAuthAuthorization } = await db;

      try {
        await OAuthAuthorization.destroy({ where: { refreshToken: token.refreshToken } });
        return true;
      } catch (e) {
        return false;
      }
    },

    // XXX: Implement when implementing scopes
    // async validateScope(user, client, scope) {
    // },
  };
}
