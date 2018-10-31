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

export default function oauth2Model(db, grant) {
  return {
    async generateAccessToken(client, user, scope) {
      return generateToken(client, user, scope, 10800); // expires in 3 hours
    },

    async generateRefreshToken(client, user, scope) {
      generateToken(client, user, scope);
    },

    async generateAuthorizationCode(client, user, scope) {
      generateToken(client, user, scope);
    },

    async getAccessToken(accessToken) {
      const { OAuthToken } = await db;
      const token = await OAuthToken.find({ where: { token: accessToken } });

      if (!token) {
        return null;
      }

      try {
        const dec = jwt.verify(accessToken, secret);
        return {
          accessToken,
          accessTokenExpiresAt: new Date(dec.exp * 1000),
          scope: dec.scopes,
          client: { id: dec.client_id },
          user: { id: dec.sub },
        };
      } catch (err) {
        return null;
      }
    },

    async getRefreshToken(refreshToken) {
      const { OAuthToken } = await db;
      const token = await OAuthToken.find({ where: { refreshToken } });

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
      const { OAuthAuthorization } = await db;
      const token = await OAuthAuthorization.find(
        { where: { token: authorizationCode } },
        { raw: true },
      );

      if (!token) {
        return null;
      }

      const config = grant.config[token.provider];
      const expiresAt = new Date();
      expiresAt.setTime(expiresAt.getTime() + 60 * 60 * 1000); // XXX: Find a good way to properly store expiresAt.

      return {
        code: authorizationCode,
        expiresAt,
        user: { id: token.UserId },
        client: { id: config.key, secret: config.secret },
        scope: 'apps:read apps:write',
      };
    },

    async getClient(clientId, clientSecret) {
      const { OAuthClient } = await db;

      const clause = clientSecret ? { clientId, clientSecret } : { clientId };
      const client = await OAuthClient.find({ where: clause });
      const config = Object.values(grant.config).find(
        entry => entry.key === clientId && entry.secret === clientSecret,
      );

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
      const { EmailAuthorization } = await db;
      const user = await EmailAuthorization.find({ where: { email: username } }, { raw: true });

      if (!(user || bcrypt.compareSync(password, user.password))) {
        return false;
      }

      return { id: user.UserId, verified: user.verified, email: user.email, name: user.name };
    },

    async saveToken(token, client, user) {
      const { OAuthToken } = await db;

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
      const { OAuthToken } = await db;

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
