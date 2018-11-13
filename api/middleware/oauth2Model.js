import crypto from 'crypto';

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export default function oauth2Model({ db, grant, secret }) {
  const { EmailAuthorization, OAuthToken, OAuthAuthorization, OAuthClient } = db.models;

  return {
    async generateToken(client, user, scope, expiresIn = 10800) {
      // expires in 3 hours by default
      return jwt.sign(
        {
          scopes: scope,
          client_id: client.id,
        },
        secret,
        {
          issuer: 'appsemble-api',
          subject: `${user.id}`,
          expiresIn,
        },
      );
    },

    async generateAccessToken(client, user, scope) {
      return this.generateToken(client, user, scope);
    },

    async generateRefreshToken() {
      return crypto.randomBytes(40).toString('hex');
    },

    async generateAuthorizationCode(client, user, scope) {
      return this.generateToken(client, user, scope);
    },

    async getAccessToken(accessToken) {
      const token = await OAuthToken.findOne({ where: { token: accessToken } });

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
      const token = await OAuthToken.findOne({ where: { refreshToken } });

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

    async getAuthorizationCode(authorizationCode) {
      const token = await OAuthAuthorization.findOne(
        { where: { token: authorizationCode } },
        { raw: true },
      );

      if (!token) {
        return null;
      }

      const expiresAt = new Date();
      expiresAt.setTime(expiresAt.getTime() + 3 * 60 * 60 * 1000); // The duration of the generated JWT.

      return {
        code: authorizationCode,
        expiresAt,
        user: { id: token.UserId },
        client: { id: 'appsemble-editor' }, // XXX: Figure out how to determine the client ID properly.
        scope: 'apps:read apps:write',
      };
    },

    async getClient(clientId, clientSecret) {
      const clause = clientSecret ? { clientId, clientSecret } : { clientId };
      const client = await OAuthClient.findOne({ where: clause });
      const config = grant
        ? Object.values(grant.config).find(
            entry => entry.key === clientId && entry.secret === clientSecret,
          )
        : undefined;

      if (!client && !config) {
        return false;
      }

      return config
        ? {
            id: config.key,
            secret: config.secret,
            grants: ['authorization_code', 'refresh_token'],
          }
        : {
            id: client.clientId,
            secret: client.clientSecret,
            redirect_uris: [client.redirectUri],
            grants: ['password', 'refresh_token', 'authorization_code'],
          };
    },

    async getUser(username, password) {
      const user = await EmailAuthorization.findOne({ where: { email: username } }, { raw: true });

      if (!(user || bcrypt.compareSync(password, user.password))) {
        return false;
      }

      return { id: user.UserId, verified: user.verified, email: user.email, name: user.name };
    },

    async saveToken(token, client, user) {
      await OAuthToken.create({
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

    async saveAuthorizationCode(code, client, user) {
      return this.saveToken(code, client, user);
    },

    async revokeToken(token) {
      try {
        await OAuthToken.destroy({ where: { refreshToken: token.refreshToken } });
        return true;
      } catch (e) {
        return false;
      }
    },

    async revokeAuthorizationCode() {
      // we want to manage these manually.
      return true;
    },

    // XXX: Implement when implementing scopes
    // async validateScope(user, client, scope) {
    // },
  };
}
