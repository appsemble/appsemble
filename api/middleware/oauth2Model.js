import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

function generateToken(client, user, scope, expiresIn) {
  const secret = process.env.OAUTH_SECRET || 'appsemble';
  const token = jwt.sign(
    {
      scopes: scope,
      client_id: client.id,
    },
    secret,
    {
      issuer: 'appsemble-api',
      ...(expiresIn && expiresIn),
      ...(user.email && { subject: user.email }),
    },
  );

  return token;
}

export default function oauth2Model(db) {
  return {
    generateAccessToken: async (client, user, scope) => generateToken(client, user, scope, 10800), // expires in 3 hours
    generateRefreshToken: async (client, user, scope) => generateToken(client, user, scope),

    getAccessToken: async accessToken => {
      const { OAuthAuthorization } = await db;
      const token = await OAuthAuthorization.find({ where: { token: accessToken } });

      if (!token) {
        return null;
      }

      return {
        accessToken: token.token,
        accessTokenExpiresAt: token.tokenExpires,
        scope: token.scope,
        client: { id: token.clientId },
        user: { id: token.UserId },
      };
    },

    getRefreshToken: async refreshToken => {
      const { OAuthAuthorization } = await db;
      const token = await OAuthAuthorization.find({ where: { refreshToken } });

      if (!token) {
        return null;
      }

      return {
        refreshToken: token.refreshToken,
        scope: token.scope,
        client: { id: token.clientId },
        user: { id: token.UserId },
      };
    },

    getClient: async (clientId, clientSecret) => {
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

    getUser: async (username, password) => {
      const { EmailAuthorization } = await db;
      const user = await EmailAuthorization.find({ where: { email: username } }, { raw: true });

      if (!(user || bcrypt.compareSync(password, user.password))) {
        return false;
      }

      return { id: user.UserId, verified: user.verified, email: user.email, name: user.name };
    },

    saveToken: async (token, client, user) => {
      const { OAuthAuthorization } = await db;

      await OAuthAuthorization.create({
        token: token.accessToken,
        tokenExpires: token.accessTokenExpiresAt,
        clientId: client.id,
        refreshToken: token.refreshToken,
        scope: token.scope,
        UserId: user.id,
      });

      return {
        ...token,
        user,
        client,
      };
    },

    revokeToken: async token => {
      const { OAuthAuthorization } = await db;

      try {
        await OAuthAuthorization.destroy({ where: { refreshToken: token.refreshToken } });
        return true;
      } catch (e) {
        return false;
      }
    },

    // XXX: Implement when implementing scopes
    // validateScope: async (user, client, scope) => {
    // },
  };
}
