import { Permission } from '@appsemble/utils';
import Boom from '@hapi/boom';
import crypto from 'crypto';
import { addMinutes } from 'date-fns';

import {
  App,
  AppOAuth2Authorization,
  AppOAuth2Secret,
  OAuth2AuthorizationCode,
  transactional,
  User,
} from '../models';
import type { KoaContext } from '../types';
import checkRole from '../utils/checkRole';
import { getAccessToken, getUserInfo } from '../utils/oauth2';
import trimUrl from '../utils/trimUrl';

interface Params {
  appId: string;
  appOAuth2SecretId: string;
}

export async function createAppOAuth2Secret(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId },
    request: { body },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
  });

  if (!app) {
    throw Boom.notFound('App not found');
  }

  await checkRole(ctx, app.OrganizationId, [Permission.EditApps, Permission.EditAppSettings]);

  ctx.body = await AppOAuth2Secret.create({ ...body, AppId: appId });
}

export async function getAppOAuth2Secrets(ctx: KoaContext<Params>): Promise<void> {
  const { appId } = ctx.params;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
    include: [AppOAuth2Secret],
  });

  if (!app) {
    throw Boom.notFound('App not found');
  }

  await checkRole(ctx, app.OrganizationId, [Permission.EditApps, Permission.EditAppSettings]);

  ctx.body = app.AppOAuth2Secrets;
}

export async function getAppOAuth2Secret(ctx: KoaContext<Params>): Promise<void> {
  const { appId, appOAuth2SecretId } = ctx.params;

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

  if (!app) {
    throw Boom.notFound('App not found');
  }

  if (!app.AppOAuth2Secrets?.length) {
    throw Boom.notFound('OAuth2 secret not found');
  }

  [ctx.body] = app.AppOAuth2Secrets;
}

export async function verifyAppOAuth2SecretCode(ctx: KoaContext<Params>): Promise<void> {
  const {
    headers,
    params: { appId, appOAuth2SecretId },
    request: {
      body: { code, redirectUri, scope },
    },
    user,
  } = ctx;
  const referer = trimUrl(headers.referer);

  const app = await App.findByPk(appId, {
    attributes: ['id'],
    include: [
      {
        attributes: ['id', 'tokenUrl', 'clientId', 'clientSecret'],
        model: AppOAuth2Secret,
        required: false,
        where: { id: appOAuth2SecretId },
      },
    ],
  });

  if (!app) {
    throw Boom.notFound('App not found');
  }

  if (!app.AppOAuth2Secrets?.length) {
    throw Boom.notFound('OAuth2 secret not found');
  }

  const [secret] = app.AppOAuth2Secrets;
  const {
    access_token: accessToken,
    id_token: idToken,
    refresh_token: refreshToken,
  } = await getAccessToken(secret.tokenUrl, code, referer, secret.clientId, secret.clientSecret);

  const { sub } = await getUserInfo(accessToken, idToken, secret.userInfoUrl);
  const authorization = await AppOAuth2Authorization.findOne({
    where: { sub, AppOAuth2SecretId: secret.id },
  });

  const authorizationCode = await transactional(async (transaction) => {
    const { id: UserId } = user ?? (await User.create({ transaction }));

    if (authorization) {
      await authorization.update({ accessToken, refreshToken }, { transaction });
    } else {
      await AppOAuth2Authorization.create(
        { accessToken, AppOAuth2SecretId: secret.id, refreshToken, sub, UserId },
        { transaction },
      );
    }
    return OAuth2AuthorizationCode.create(
      {
        AppId: app.id,
        code: crypto.randomBytes(10).toString('hex'),
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
