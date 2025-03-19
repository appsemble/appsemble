import { assertKoaCondition, throwKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { OAuthAuthorization, transactional, User } from '../../../../../models/index.js';
import { argv } from '../../../../../utils/argv.js';
import { processEmailAuthorization } from '../../../../../utils/auth.js';
import { createJWTResponse } from '../../../../../utils/createJWTResponse.js';
import { getAccessToken, getUserInfo } from '../../../../../utils/oauth2.js';
import {
  githubPreset,
  gitlabPreset,
  googlePreset,
  presets,
} from '../../../../../utils/OAuth2Presets.js';

export async function registerOAuth2Authorization(ctx: Context): Promise<void> {
  const {
    mailer,
    request: {
      body: { authorizationUrl, code },
      headers,
    },
  } = ctx;
  // XXX Replace this with an imported language array when supporting more languages
  let referer: URL;
  try {
    referer = new URL(headers.referer);
  } catch {
    throwKoaError(ctx, 400, 'The referer header is invalid');
  }
  if (referer.origin !== new URL(argv.host).origin) {
    throwKoaError(ctx, 400, 'The referer header is invalid');
  }

  const preset = presets.find((p) => p.authorizationUrl === authorizationUrl);
  let clientId: string | undefined;
  let clientSecret: string | undefined;

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

  // eslint-disable-next-line no-implicit-coercion
  assertKoaCondition(!!(clientId && clientSecret), ctx, 501, 'Unknown authorization URL');

  // Exchange the authorization code for an access token and refresh token.
  const {
    access_token: accessToken,
    id_token: idToken,
    refresh_token: refreshToken,
  } = await getAccessToken(
    preset.tokenUrl,
    code,
    String(new URL('/callback', argv.host)),
    clientId,
    clientSecret,
  );

  const { sub, ...userInfo } = await getUserInfo(
    accessToken,
    idToken,
    preset.userInfoUrl,
    preset.remapper,
    preset.userEmailsUrl,
  );

  const authorization = await OAuthAuthorization.findOne({
    where: { authorizationUrl, sub },
  });
  if (authorization?.UserId) {
    const dbUser = await User.findOne({ where: { id: authorization.UserId } });
    if (dbUser && !dbUser.primaryEmail && userInfo.email) {
      await transactional(async (transaction) => {
        await dbUser.update({ primaryEmail: userInfo.email }, { transaction });
        await processEmailAuthorization(
          mailer,
          dbUser.id,
          userInfo.name,
          userInfo.email,
          Boolean(userInfo.email_verified),
          transaction,
        );
      });
    }
    // If the combination of authorization url and sub exists, update the entry and allow the user
    // to login to Appsemble.
    await authorization.update({ accessToken, refreshToken }, { where: { authorizationUrl, sub } });
    ctx.body = createJWTResponse(authorization.UserId);
  } else {
    // Otherwise, register an authorization object and ask the user if this is the account they want
    // to use.
    await (authorization
      ? authorization.update({ accessToken, code, refreshToken })
      : OAuthAuthorization.create({
          accessToken,
          authorizationUrl: preset.authorizationUrl,
          code,
          email: userInfo.email,
          refreshToken,
          sub,
        }));
    ctx.body = userInfo;
  }
}
