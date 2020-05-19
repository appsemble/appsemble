import type { TokenResponse } from '@appsemble/types';
import Boom from '@hapi/boom';
import axios from 'axios';
import { randomBytes } from 'crypto';
import { isPast, parseISO } from 'date-fns';
import jsonwebtoken from 'jsonwebtoken';
import { Op, UniqueConstraintError } from 'sequelize';
import { URL, URLSearchParams } from 'url';

import {
  EmailAuthorization,
  OAuth2ClientCredentials,
  OAuthAuthorization,
  transactional,
  User,
} from '../models';
import type { KoaContext } from '../types';
import createJWTResponse from '../utils/createJWTResponse';
import { gitlabPreset, googlePreset, presets } from '../utils/OAuth2Presets';

interface Params {
  clientId: string;
}

export async function registerOAuth2ClientCredentials(ctx: KoaContext): Promise<void> {
  const { body } = ctx.request;
  const { user } = ctx;

  let expires;
  if (body.expires) {
    expires = parseISO(body.expires);
    if (isPast(expires)) {
      throw Boom.badRequest('These credentials have already expired');
    }
  }
  const scopes = body.scopes.sort().join(' ');
  const id = randomBytes(16).toString('hex');
  const secret = randomBytes(32).toString('hex');

  const credentials = await OAuth2ClientCredentials.create({
    description: body.description,
    expires,
    id,
    scopes,
    secret,
    UserId: user.id,
  });

  ctx.body = {
    created: credentials.created,
    description: credentials.description,
    id,
    expires,
    scopes: scopes.split(' '),
    secret,
  };
}

export async function listOAuth2ClientCredentials(ctx: KoaContext): Promise<void> {
  const { user } = ctx;

  const credentials = await OAuth2ClientCredentials.findAll({
    attributes: ['created', 'description', 'id', 'expires', 'scopes'],
    raw: true,
    where: {
      expires: { [Op.or]: [{ [Op.gt]: new Date() }, null] },
      UserId: user.id,
    },
  });

  ctx.body = credentials.map(({ scopes, ...cred }) => ({
    ...cred,
    scopes: scopes.split(' '),
  }));
}

export async function deleteOAuth2ClientCredentials(ctx: KoaContext<Params>): Promise<void> {
  const { clientId } = ctx.params;
  const { user } = ctx;

  const affectedRows = await OAuth2ClientCredentials.destroy({
    where: {
      id: clientId,
      UserId: user.id,
    },
  });

  if (!affectedRows) {
    throw Boom.notFound('No client credentials found for the given client id');
  }
}

export async function registerOAuth2Connection(ctx: KoaContext): Promise<void> {
  const { argv } = ctx;
  const { authorizationUrl, code } = ctx.request.body;
  const referer = new URL(ctx.request.headers.referer);

  const preset = presets.find((p) => p.authorizationUrl === authorizationUrl);
  let clientId: string;
  let clientSecret: string;

  if (preset === googlePreset) {
    clientId = argv.oauthGoogleKey;
    clientSecret = argv.oauthGoogleSecret;
  } else if (preset === gitlabPreset) {
    clientId = argv.oauthGitlabKey;
    clientSecret = argv.oauthGitlabSecret;
  }

  if (!clientId || !clientSecret) {
    throw Boom.notImplemented('Unknown authorization URL');
  }

  // Exchange the authorization code for an access token and refresh token.
  const {
    data: { access_token: accessToken, id_token: idToken, refresh_token: refreshToken },
  } = await axios.post<TokenResponse>(
    preset.tokenUrl,
    new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${referer.origin}${referer.pathname}`,
    }),
    { auth: { username: clientId, password: clientSecret } },
  );

  // Extract the subject from the id token, with a fallback to access token.
  const { sub } = jsonwebtoken.decode(idToken ?? accessToken);
  // Fetch the user info from the OpenID userinfo endpoint.
  const { data: userInfo } = await axios.get(preset.userInfoUrl, {
    headers: { authorization: `Bearer ${accessToken}` },
  });

  const authorization = await OAuthAuthorization.findOne({
    where: { authorizationUrl, sub },
    attributes: ['UserId'],
  });
  if (authorization?.UserId) {
    // If the combination of authorization url and sub exists, update the entry and allow the user
    // to login to Appsemble.
    await OAuthAuthorization.update(
      { accessToken, refreshToken },
      { where: { authorizationUrl, sub } },
    );
    ctx.body = createJWTResponse(authorization.UserId, argv);
  } else {
    // Otherwise, register an authorization object and ask the user if this is the account they want
    // to use.
    if (authorization) {
      await OAuthAuthorization.update(
        { accessToken, code, refreshToken },
        { where: { sub, authorizationUrl: preset.authorizationUrl } },
      );
    } else {
      await OAuthAuthorization.create({
        accessToken,
        authorizationUrl: preset.authorizationUrl,
        code,
        refreshToken,
        sub,
      });
    }
    ctx.body = {
      name: userInfo.name,
      email: userInfo.email,
      profile: userInfo.profile,
      picture: userInfo.picture,
    };
  }
}

export async function connectPendingOAuth2Profile(ctx: KoaContext): Promise<void> {
  const { argv } = ctx;
  const { authorizationUrl, code } = ctx.request.body;
  let { user } = ctx;
  const preset = presets.find((p) => p.authorizationUrl === authorizationUrl);

  if (!preset) {
    throw Boom.notImplemented('Unknown authorization URL');
  }

  const authorization = await OAuthAuthorization.findOne({
    where: { code, authorizationUrl },
    attributes: ['authorizationUrl', 'accessToken', 'sub', 'UserId'],
  });

  if (!authorization) {
    throw Boom.notFound('No pending OAuth2 authorization found for given state');
  }

  // The user is already logged in to Appsemble.
  if (user) {
    // The OAuth2 authorization is not yet linked to a user, so we link it to the authenticated
    // user. From now on the user will be able to login to this account using this OAuth2 provider.
    if (!authorization.UserId) {
      await authorization.update({ UserId: user.id, code: null });
    }

    // The authorization is already linked to another account, so we disallow linking it again.
    else if (authorization.UserId !== user.id) {
      throw Boom.forbidden('This OAuth2 authorization is already linked to an account.');
    }
  }
  // The user is not yet logged in, so they are trying to register a new account using this OAuth2
  // provider.
  else {
    const { data: userInfo } = await axios.get(preset.userInfoUrl, {
      headers: { authorization: `Bearer ${authorization.accessToken}` },
    });
    try {
      await transactional(async (transaction) => {
        user = await User.create(
          { name: userInfo.name, primaryEmail: userInfo.email },
          { transaction },
        );
        await OAuthAuthorization.update(
          { UserId: user.id },
          { transaction, where: { code, authorizationUrl } },
        );
        if (userInfo.email) {
          // We’ll try to link this email address to the new user, even though no password has been
          // set.
          await EmailAuthorization.create(
            { UserId: user.id, email: userInfo.email, verified: userInfo.email_verified },
            { transaction },
          );
        }
      });
    } catch (err) {
      throw Boom.conflict('This email address has already been linked to an existing account.');
    }
  }
  ctx.body = createJWTResponse(user.id, argv);
}
