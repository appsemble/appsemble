import { randomBytes } from 'node:crypto';

import { assertKoaError, throwKoaError } from '@appsemble/node-utils';
import { Permission } from '@appsemble/utils';
import { addMinutes } from 'date-fns';
import { type Context } from 'koa';

import {
  App,
  AppMember,
  AppOAuth2Authorization,
  AppOAuth2Secret,
  OAuth2AuthorizationCode,
  transactional,
  User,
} from '../models/index.js';
import { argv } from '../utils/argv.js';
import { checkAppLock } from '../utils/checkAppLock.js';
import { checkRole } from '../utils/checkRole.js';
import { getAccessToken, getUserInfo } from '../utils/oauth2.js';

export async function createAppOAuth2Secret(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: { body },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  checkAppLock(ctx, app);
  await checkRole(ctx, app.OrganizationId, [Permission.EditApps, Permission.EditAppSettings]);

  const { id } = await AppOAuth2Secret.create({ ...body, AppId: appId });
  ctx.body = { ...body, id };
}

export async function getAppOAuth2Secrets(ctx: Context): Promise<void> {
  const { appId } = ctx.pathParams;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
    include: [AppOAuth2Secret],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  await checkRole(ctx, app.OrganizationId, [Permission.EditApps, Permission.EditAppSettings]);

  ctx.body = app.AppOAuth2Secrets;
}

export async function getAppOAuth2Secret(ctx: Context): Promise<void> {
  const { appId, appOAuth2SecretId } = ctx.pathParams;

  const app = await App.findByPk(appId, {
    attributes: [],
    include: [
      {
        attributes: ['authorizationUrl', 'clientId', 'scope'],
        model: AppOAuth2Secret,
        where: { id: appOAuth2SecretId },
      },
    ],
  });

  assertKoaError(!app, ctx, 404, 'App not found');
  assertKoaError(!app.AppOAuth2Secrets?.length, ctx, 404, 'OAuth2 secret not found');

  [ctx.body] = app.AppOAuth2Secrets;
}

export async function updateAppOAuth2Secret(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, appOAuth2SecretId },
    request: {
      body: { id, ...body },
    },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
    include: [{ model: AppOAuth2Secret, required: false, where: { id: appOAuth2SecretId } }],
  });

  assertKoaError(!app, ctx, 404, 'App not found');
  assertKoaError(!app.AppOAuth2Secrets?.length, ctx, 404, 'OAuth2 secret not found');

  await checkRole(ctx, app.OrganizationId, [Permission.EditApps, Permission.EditAppSettings]);

  const [secret] = app.AppOAuth2Secrets;
  await secret.update(body);
  ctx.body = secret;
}

export async function deleteAppOAuth2Secret(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, appOAuth2SecretId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
    include: [{ model: AppOAuth2Secret, required: false, where: { id: appOAuth2SecretId } }],
  });

  assertKoaError(!app, ctx, 404, 'App not found');
  assertKoaError(!app.AppOAuth2Secrets?.length, ctx, 404, 'OAuth2 secret not found');

  await checkRole(ctx, app.OrganizationId, [Permission.EditApps, Permission.EditAppSettings]);

  const [secret] = app.AppOAuth2Secrets;
  await secret.destroy();
}

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
    const { id: UserId } = user ?? (await User.create({ timezone }, { transaction }));
    const role = app.definition.security?.default?.role;
    let appMember = await AppMember.findOne({
      attributes: ['id'],
      where: { UserId, AppId: appId },
      transaction,
    });
    if (!appMember) {
      appMember = await AppMember.create(
        { UserId, AppId: appId, role, name, email, emailVerified },
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
        code: randomBytes(10).toString('hex'),
        expires: addMinutes(new Date(), 10),
        redirectUri,
        scope,
        UserId,
      },
      { transaction },
    );
  });

  ctx.body = { code: authorizationCode.code };
}
