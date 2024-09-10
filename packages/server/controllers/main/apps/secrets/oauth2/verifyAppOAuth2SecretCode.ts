import { randomBytes } from 'node:crypto';

import { assertKoaError, throwKoaError } from '@appsemble/node-utils';
import { addMinutes } from 'date-fns';
import { type Context } from 'koa';

import {
  App,
  AppMember,
  AppOAuth2Authorization,
  AppOAuth2Secret,
  OAuth2AuthorizationCode,
  transactional,
} from '../../../../../models/index.js';
import { argv } from '../../../../../utils/argv.js';
import { getAccessToken, getUserInfo } from '../../../../../utils/oauth2.js';

export async function verifyAppOAuth2SecretCode(ctx: Context): Promise<void> {
  const {
    headers,
    pathParams: { appId, appOAuth2SecretId },
    request: {
      body: { code, redirectUri, scope, timezone },
    },
    user,
  } = ctx;
  // XXX Replace this with an imported language array when supporting more languages
  let referer: URL;
  try {
    referer = new URL(headers.referer);
  } catch {
    throwKoaError(ctx, 400, 'The referer header is invalid');
  }

  assertKoaError(
    referer.origin !== new URL(argv.host).origin,
    ctx,
    400,
    'The referer header is invalid',
  );

  const app = await App.findByPk(appId, {
    attributes: ['id', 'definition'],
    include: [
      {
        attributes: ['id', 'tokenUrl', 'clientId', 'clientSecret', 'remapper', 'userInfoUrl'],
        model: AppOAuth2Secret,
        required: false,
        where: { id: appOAuth2SecretId },
      },
    ],
  });

  assertKoaError(!app, ctx, 404, 'App not found');
  assertKoaError(!app.AppOAuth2Secrets?.length, ctx, 404, 'OAuth2 secret not found');

  const [secret] = app.AppOAuth2Secrets;
  const {
    access_token: accessToken,
    id_token: idToken,
    refresh_token: refreshToken,
  } = await getAccessToken(
    secret.tokenUrl,
    code,
    String(new URL('/callback', argv.host)),
    secret.clientId,
    secret.clientSecret,
  );

  const {
    email,
    email_verified: emailVerified,
    name,
    sub,
  } = await getUserInfo(accessToken, idToken, secret.userInfoUrl, secret.remapper);
  const authorization = await AppOAuth2Authorization.findOne({
    where: { sub, AppOAuth2SecretId: secret.id },
  });

  const authorizationCode = await transactional(async (transaction) => {
    let appMember = await AppMember.findByPk(authorization?.AppMemberId, { transaction });

    const role = app.definition.security?.default?.role;
    if (!appMember) {
      appMember = await AppMember.create(
        { AppId: appId, role, name, email, emailVerified, timezone, UserId: user.id },
        { transaction },
      );
    }

    await (authorization
      ? authorization.update({ accessToken, refreshToken }, { transaction })
      : AppOAuth2Authorization.create(
          {
            accessToken,
            AppOAuth2SecretId: secret.id,
            refreshToken,
            sub,
            AppMemberId: appMember.id,
          },
          { transaction },
        ));
    return OAuth2AuthorizationCode.create(
      {
        AppId: app.id,
        AppMemberId: appMember.id,
        code: randomBytes(10).toString('hex'),
        expires: addMinutes(new Date(), 10),
        redirectUri,
        scope,
      },
      { transaction },
    );
  });

  ctx.body = { code: authorizationCode.code };
}
