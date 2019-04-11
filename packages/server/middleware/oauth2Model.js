import crypto from 'crypto';

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export default function oauth2Model({ db, grant, secret }) {
  const {
    EmailAuthorization,
    Organization,
    OAuthToken,
    OAuthAuthorization,
    OAuthClient,
    User,
  } = db.models;

  async function getOrganizations(UserId) {
    const organizations = await Organization.findAll({
      include: {
        model: User,
        through: { where: { UserId } },
        required: true,
        attributes: ['id'],
      },
    });

    return organizations.map(({ id }) => ({ id }));
  }

  async function generateToken(client, user, scope, expiresIn = 10800) {
    // expires in 3 hours by default
    return jwt.sign(
      {
        scopes: scope,
        client_id: client.id,
        user,
      },
      secret,
      {
        issuer: 'appsemble-api',
        subject: `${user.id}`,
        expiresIn,
      },
    );
  }

  return {
    async generateAccessToken(client, user, scope) {
      return generateToken(client, user, scope);
    },

    async generateRefreshToken() {
      return crypto.randomBytes(40).toString('hex');
    },

    async generateAuthorizationCode(client, user, scope) {
      return generateToken(client, user, scope);
    },

    async getAccessToken(accessToken) {
      const token = await OAuthToken.findOne({ where: { token: accessToken } });

      if (!token) {
        return null;
      }

      try {
        const payload = jwt.verify(accessToken, secret);

        const organizations = await getOrganizations(payload.sub);

        return {
          accessToken,
          accessTokenExpiresAt: new Date(payload.exp * 1000),
          scope: payload.scopes,
          client: { id: payload.client_id },
          user: { id: payload.sub, organizations },
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
        const dec = jwt.verify(token.token, secret);
        const organizations = await getOrganizations(dec.sub);

        return {
          refreshToken,
          scope: dec.scopes,
          client: { id: dec.client_id },
          user: { id: dec.sub, organizations },
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
      // The duration of the generated JWT.
      expiresAt.setTime(expiresAt.getTime() + 3 * 60 * 60 * 1000);

      const organizations = await getOrganizations(token.UserId);

      return {
        code: authorizationCode,
        expiresAt,
        user: { id: token.UserId, organizations },
        // XXX: Figure out how to determine the client ID properly.
        client: { id: 'appsemble-editor' },
        scope: 'apps:read apps:write organizations:read organizations:style organizations:write',
      };
    },

    async getClient(clientId, clientSecret) {
      const clause = clientSecret ? { clientId, clientSecret } : { clientId };
      const client =
        clientId === 'appsemble-editor'
          ? { ...clause, redirectUri: '/editor' }
          : await OAuthClient.findOne({ where: clause });
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
      const email = await EmailAuthorization.findOne({ where: { email: username }, raw: true });

      if (!(email && (await bcrypt.compare(password, email.password)))) {
        return false;
      }

      const organizations = await getOrganizations(email.UserId);

      return {
        id: email.UserId,
        verified: email.verified,
        email: email.email,
        name: email.name,
        organizations,
      };
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
  };
}
