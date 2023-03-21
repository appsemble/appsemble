import { Permission } from '@appsemble/utils';
import { notFound } from '@hapi/boom';
import { type Context } from 'koa';

import { App, AppServiceSecret } from '../models/index.js';
import { argv } from '../utils/argv.js';
import { checkAppLock } from '../utils/checkAppLock.js';
import { checkRole } from '../utils/checkRole.js';
import { encrypt } from '../utils/crypto.js';

export async function addAppServiceSecret(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: { body },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
  });

  if (!app) {
    throw notFound('App not found');
  }

  checkAppLock(ctx, app);
  await checkRole(ctx, app.OrganizationId, [Permission.EditApps, Permission.EditAppSettings]);

  const { authenticationMethod, id, identifier, serviceName, tokenUrl, urlPatterns } =
    await AppServiceSecret.create({
      ...body,
      secret: encrypt(body.secret, argv.aesSecret),
      AppId: appId,
    });

  ctx.body = {
    authenticationMethod,
    id,
    identifier,
    serviceName,
    urlPatterns,
    tokenUrl,
  };
}

export async function getAppServiceSecrets(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
  });

  if (!app) {
    throw notFound('App not found');
  }

  checkAppLock(ctx, app);
  await checkRole(ctx, app.OrganizationId, [Permission.EditApps, Permission.EditAppSettings]);

  const serviceSecrets = await AppServiceSecret.findAll({
    attributes: ['id', 'urlPatterns', 'authenticationMethod', 'identifier', 'tokenUrl'],
    where: {
      AppId: appId,
    },
  });

  ctx.body = serviceSecrets.map((secret) => secret.toJSON());
}

export async function updateAppServiceSecret(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, appServiceId },
    request: { body },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
  });

  if (!app) {
    throw notFound('App not found');
  }

  checkAppLock(ctx, app);
  await checkRole(ctx, app.OrganizationId, [Permission.EditApps, Permission.EditAppSettings]);

  const appServiceSecret = await AppServiceSecret.findByPk(appServiceId);

  if (!appServiceSecret) {
    throw notFound('Cannot find the app service secret to update');
  }

  await appServiceSecret.update({
    ...body,
    secret: encrypt(body.secret, argv.aesSecret),
    AppId: appId,
  });

  const { authenticationMethod, id, identifier, serviceName, tokenUrl, urlPatterns } =
    appServiceSecret;

  ctx.body = {
    authenticationMethod,
    id,
    serviceName,
    identifier,
    urlPatterns,
    tokenUrl,
  };
}

export async function deleteAppServiceSecret(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, appServiceId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
  });

  if (!app) {
    throw notFound('App not found');
  }

  checkAppLock(ctx, app);
  await checkRole(ctx, app.OrganizationId, [Permission.EditApps, Permission.EditAppSettings]);

  const appServiceSecret = await AppServiceSecret.findByPk(appServiceId);

  if (!appServiceSecret) {
    throw notFound('Cannot find the app service secret to delete');
  }

  await appServiceSecret.destroy();

  ctx.status = 204;
}
