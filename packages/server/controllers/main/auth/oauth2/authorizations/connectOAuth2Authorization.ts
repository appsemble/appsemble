import { assertKoaCondition, throwKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { DatabaseError } from 'sequelize';

import {
  EmailAuthorization,
  OAuthAuthorization,
  transactional,
  User,
} from '../../../../../models/index.js';
import { processEmailAuthorization } from '../../../../../utils/auth.js';
import { createJWTResponse } from '../../../../../utils/createJWTResponse.js';
import { getUserInfo } from '../../../../../utils/oauth2.js';
import { presets } from '../../../../../utils/OAuth2Presets.js';

export async function connectOAuth2Authorization(ctx: Context): Promise<void> {
  let {
    mailer,
    request: {
      body: { authorizationUrl, code, timezone },
    },
    user,
  } = ctx;
  const preset = presets.find((p) => p.authorizationUrl === authorizationUrl);

  assertKoaCondition(!!preset, ctx, 501, 'Unknown authorization URL');

  const authorization = await OAuthAuthorization.findOne({ where: { code, authorizationUrl } });

  assertKoaCondition(
    !!authorization,
    ctx,
    404,
    'No pending OAuth2 authorization found for given state',
  );

  // The user is already logged in to Appsemble.
  if (user) {
    // The OAuth2 authorization is not yet linked to a user, so we link it to the authenticated
    // user. From now on the user will be able to login to this account using this OAuth2 provider.
    if (!authorization.UserId) {
      await authorization.update({ UserId: user.id, code: null });
    }

    // The authorization is already linked to another account, so we disallow linking it again.
    else if (authorization.UserId !== user.id) {
      throwKoaError(ctx, 403, 'This OAuth2 authorization is already linked to an account.');
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
      preset.userEmailsUrl,
    );
    await transactional(async (transaction) => {
      try {
        user = await User.create(
          {
            name: userInfo.name,
            primaryEmail: userInfo.email,
            timezone: userInfo.zoneinfo || timezone,
          },
          { transaction },
        );
      } catch (error) {
        if (error instanceof DatabaseError) {
          throwKoaError(
            ctx,
            409,
            'This email address has already been linked to an existing account',
          );
        }
      }
      await authorization.update({ UserId: user.id }, { transaction });
      if (userInfo.email) {
        // We’ll try to link this email address to the new user, even though no password has been
        // set.
        const emailAuthorization = await EmailAuthorization.findOne({
          where: { email: userInfo.email.toLowerCase() },
        });
        if (emailAuthorization) {
          assertKoaCondition(
            emailAuthorization.UserId === user.id,
            ctx,
            409,
            'This email address has already been linked to an existing account.',
          );
        } else {
          await processEmailAuthorization(
            mailer,
            user.id,
            userInfo.name,
            userInfo.email,
            Boolean(userInfo.email_verified),
            transaction,
          );
        }
      }
    });
  }
  ctx.body = createJWTResponse(user.id);
}
