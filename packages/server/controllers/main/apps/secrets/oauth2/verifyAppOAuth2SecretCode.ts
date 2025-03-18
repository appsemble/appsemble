import { assertKoaCondition, throwKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';

import {
  App,
  AppMember,
  AppOAuth2Authorization,
  AppOAuth2Secret,
} from '../../../../../models/index.js';
import { argv } from '../../../../../utils/argv.js';
import { handleUniqueAppMemberEmailIndex } from '../../../../../utils/auth.js';
import {
  createAppOAuth2AuthorizationCode,
  getAccessToken,
  getUserInfo,
} from '../../../../../utils/oauth2.js';

export async function verifyAppOAuth2SecretCode(ctx: Context): Promise<void> {
  const {
    headers,
    pathParams: { appId, appOAuth2SecretId },
    request: {
      body: { code, redirectUri, scope, timezone },
    },
  } = ctx;
  // XXX Replace this with an imported language array when supporting more languages
  let referer: URL;
  try {
    referer = new URL(headers.referer);
  } catch {
    throwKoaError(ctx, 400, 'The referer header is invalid');
  }

  assertKoaCondition(
    referer.origin === new URL(argv.host).origin,
    ctx,
    400,
    'The referer header is invalid',
  );

  const app = await App.findByPk(appId, {
    attributes: ['id', 'path', 'OrganizationId', 'definition'],
    include: [
      {
        attributes: ['id', 'tokenUrl', 'clientId', 'clientSecret', 'remapper', 'userInfoUrl'],
        model: AppOAuth2Secret,
        where: { id: appOAuth2SecretId },
        required: false,
      },
    ],
  });

  assertKoaCondition(app != null, ctx, 404, 'App not found');
  assertKoaCondition(
    app.AppOAuth2Secrets != null && app.AppOAuth2Secrets.length > 0,
    ctx,
    404,
    'OAuth2 secret not found',
  );

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
    include: [{ model: AppMember, attributes: ['id'] }],
  });

  function handleAuthorization(appMember?: AppMember): Promise<AppOAuth2Authorization> {
    return authorization
      ? authorization.update({ accessToken, refreshToken })
      : AppOAuth2Authorization.create({
          accessToken,
          AppOAuth2SecretId: secret.id,
          refreshToken,
          sub,
          email,
          emailVerified,
          AppMemberId: appMember?.id,
        });
  }

  let appMember = authorization?.AppMember;
  if (!appMember) {
    const role = app.definition.security?.default?.role;
    try {
      appMember = await AppMember.create({
        AppId: appId,
        role,
        name,
        email,
        emailVerified,
        timezone,
      });
      await handleAuthorization(appMember);
    } catch (error) {
      await handleUniqueAppMemberEmailIndex(ctx, error, email, emailVerified, async (data) => {
        const { AppOAuth2SecretId, sub: subject } = await handleAuthorization();
        throwKoaError(ctx, 409, 'Account already exists for this email.', {
          externalId: subject,
          secret: `oauth2:${AppOAuth2SecretId}`,
          ...data,
        });
      });
    }
  }

  const appOAuth2AuthorizationCode = await createAppOAuth2AuthorizationCode(
    app,
    redirectUri,
    scope,
    appMember,
    ctx,
  );
  ctx.body = { code: appOAuth2AuthorizationCode.code };
}
