import Boom from '@hapi/boom';
import crypto from 'crypto';

import { EmailAuthorization, OAuthAuthorization, transactional, User } from '../models';
import type { KoaContext } from '../types';
import createJWTResponse from '../utils/createJWTResponse';
import type { Recipient } from '../utils/email/Mailer';
import { getAccessToken, getUserInfo } from '../utils/oauth2';
import { githubPreset, gitlabPreset, googlePreset, presets } from '../utils/OAuth2Presets';
import trimUrl from '../utils/trimUrl';

export async function registerOAuth2Connection(ctx: KoaContext): Promise<void> {
  const {
    argv,
    request: {
      body: { authorizationUrl, code },
      headers,
    },
  } = ctx;
  const referer = trimUrl(headers.referer);
  if (!referer) {
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
  const {
    access_token: accessToken,
    id_token: idToken,
    refresh_token: refreshToken,
  } = await getAccessToken(preset.tokenUrl, code, referer, clientId, clientSecret);

  const { sub, ...userInfo } = await getUserInfo(
    accessToken,
    idToken,
    preset.userInfoUrl,
    preset.remapper,
  );

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
  const {
    argv,
    mailer,
    request: {
      body: { authorizationUrl, code },
    },
  } = ctx;
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
    const userInfo = await getUserInfo(
      authorization.accessToken,
      null,
      preset.userInfoUrl,
      preset.remapper,
    );
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
          const verified = Boolean(userInfo.email_verified);
          const key = verified ? null : crypto.randomBytes(40).toString('hex');
          await EmailAuthorization.create(
            { UserId: user.id, email: userInfo.email, key, verified },
            { transaction },
          );
          if (!verified) {
            await mailer.sendTemplateEmail(userInfo as Recipient, 'resend', {
              url: `${argv.host}/verify?token=${key}`,
            });
          }
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
  const {
    query: { authorizationUrl },
    user,
  } = ctx;

  const rows = await OAuthAuthorization.destroy({ where: { UserId: user.id, authorizationUrl } });

  if (!rows) {
    throw Boom.notFound('OAuth2 account to unlink not found');
  }
}
