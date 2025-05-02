import { assertKoaCondition, throwKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';

import {
  App,
  type AppMember,
  type AppOAuth2Authorization,
  getAppDB,
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
  try {
    const referer = new URL(headers.referer!);
    assertKoaCondition(
      referer.origin === new URL(argv.host).origin,
      ctx,
      400,
      'The referer header is invalid',
    );
  } catch {
    throwKoaError(ctx, 400, 'The referer header is invalid');
  }

  const app = await App.findByPk(appId, {
    // It is VERY important to include domain here
    // It is used to verify the oauth2 redirectUrl
    attributes: ['id', 'path', 'OrganizationId', 'definition', 'domain'],
  });
  assertKoaCondition(app != null, ctx, 404, 'App not found');

  const { AppMember, AppOAuth2Authorization, AppOAuth2Secret } = await getAppDB(appId);
  const appOAuth2Secrets = await AppOAuth2Secret.findAll({
    attributes: ['id', 'tokenUrl', 'clientId', 'clientSecret', 'remapper', 'userInfoUrl'],
    where: { id: appOAuth2SecretId },
  });

  assertKoaCondition(appOAuth2Secrets.length > 0, ctx, 404, 'OAuth2 secret not found');

  const [secret] = appOAuth2Secrets;
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
        role,
        name,
        email,
        emailVerified,
        timezone,
      });
      await handleAuthorization(appMember);
    } catch (error) {
      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks) - Severe
      await handleUniqueAppMemberEmailIndex(ctx, error, email, emailVerified, async (data) => {
        const { AppOAuth2SecretId, sub: subject } = await handleAuthorization();
        throwKoaError(ctx, 409, 'Account already exists for this email.', {
          externalId: subject,
          secret: `oauth2:${AppOAuth2SecretId}`,
          ...data,
        });
      });
    }
    appMember = appMember!;
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
