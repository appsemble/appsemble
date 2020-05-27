import type { TokenResponse } from '@appsemble/types';
import Boom from '@hapi/boom';
import axios from 'axios';
import { URL, URLSearchParams } from 'url';

import { EmailAuthorization, OAuthAuthorization, transactional, User } from '../models';
import type { KoaContext } from '../types';
import createJWTResponse from '../utils/createJWTResponse';
import getUserInfo from '../utils/getUserInfo';
import { githubPreset, gitlabPreset, googlePreset, presets } from '../utils/OAuth2Presets';

export async function registerOAuth2Connection(ctx: KoaContext): Promise<void> {
  const { argv } = ctx;
  const { authorizationUrl, code } = ctx.request.body;
  let referer: URL;
  try {
    referer = new URL(ctx.request.headers.referer);
  } catch (err) {
    throw Boom.badRequest('The referer header is invalid');
  }

  const preset = presets.find((p) => p.authorizationUrl === authorizationUrl);
  let clientId: string;
  let clientSecret: string;

  if (preset === googlePreset) {
    clientId = argv.googleClientId;
    clientSecret = argv.googleClientSecret;
  } else if (preset === gitlabPreset) {
    clientId = argv.gitlabClientId;
    clientSecret = argv.gitlabClientSecret;
  } else if (preset === githubPreset) {
    clientId = argv.githubClientId;
    clientSecret = argv.githubClientSecret;
  }

  if (!clientId || !clientSecret) {
    throw Boom.notImplemented('Unknown authorization URL');
  }

  // Exchange the authorization code for an access token and refresh token.
  const { data: tokenResponse } = await axios.post<TokenResponse>(
    preset.tokenUrl,
    new URLSearchParams({
      grant_type: 'authorization_code',
      // Some providers only support client credentials in the request body,
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: `${referer.origin}${referer.pathname}`,
    }),
    {
      headers: {
        // Explicitly request JSON. Otherwise, some services, e.g. GitHub, give a bad response.
        accept: 'application/json',
        // Some providers only support basic auth,
        authorization: `Basic ${clientId}:${clientSecret}`,
      },
    },
  );

  const { access_token: accessToken, refresh_token: refreshToken } = tokenResponse;
  const { sub, ...userInfo } = await getUserInfo(preset, tokenResponse);

  const authorization = await OAuthAuthorization.findOne({
    where: { authorizationUrl, sub },
  });
  if (authorization?.UserId) {
    // If the combination of authorization url and sub exists, update the entry and allow the user
    // to login to Appsemble.
    await authorization.update({ accessToken, refreshToken }, { where: { authorizationUrl, sub } });
    ctx.body = createJWTResponse(authorization.UserId, argv);
  } else {
    // Otherwise, register an authorization object and ask the user if this is the account they want
    // to use.
    if (authorization) {
      await authorization.update({ accessToken, code, refreshToken });
    } else {
      await OAuthAuthorization.create({
        accessToken,
        authorizationUrl: preset.authorizationUrl,
        code,
        refreshToken,
        sub,
      });
    }
    ctx.body = userInfo;
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

  const authorization = await OAuthAuthorization.findOne({ where: { code, authorizationUrl } });

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
    await transactional(async (transaction) => {
      user = await User.create(
        { name: userInfo.name, primaryEmail: userInfo.email },
        { transaction },
      );
      await authorization.update({ UserId: user.id }, { transaction });
      if (userInfo.email) {
        // We’ll try to link this email address to the new user, even though no password has been
        // set.
        const emailAuthorization = await EmailAuthorization.findOne({
          where: { email: userInfo.email },
        });
        if (emailAuthorization) {
          if (emailAuthorization.UserId !== user.id) {
            throw Boom.conflict(
              'This email address has already been linked to an existing account.',
            );
          }
        } else {
          await EmailAuthorization.create(
            { UserId: user.id, email: userInfo.email, verified: userInfo.email_verified },
            { transaction },
          );
        }
      }
    });
  }
  ctx.body = createJWTResponse(user.id, argv);
}

export async function getConnectedAccounts(ctx: KoaContext): Promise<void> {
  const { user } = ctx;

  ctx.body = await OAuthAuthorization.findAll({
    attributes: ['authorizationUrl'],
    where: { UserId: user.id },
  });
}

export async function unlinkConnectedAccount(ctx: KoaContext): Promise<void> {
  const { user } = ctx;
  const { authorizationUrl } = ctx.query;

  const rows = await OAuthAuthorization.destroy({ where: { UserId: user.id, authorizationUrl } });

  if (!rows) {
    throw Boom.notFound('OAuth2 account to unlink not found');
  }
}
