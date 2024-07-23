import { assertKoaError, deleteSecret, updateNamespacedSecret } from '@appsemble/node-utils';
import { Permission } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppServiceSecret } from '../models/index.js';
import { argv } from '../utils/argv.js';
import { checkAppLock } from '../utils/checkAppLock.js';
import { checkRole } from '../utils/checkRole.js';
import { encrypt } from '../utils/crypto.js';

export async function createAppServiceSecret(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: { body },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId', 'path'],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  checkAppLock(ctx, app);
  await checkRole(ctx, app.OrganizationId, [Permission.EditApps, Permission.EditAppSettings]);

  const { authenticationMethod, id, identifier, name, tokenUrl, urlPatterns } =
    await AppServiceSecret.create({
      ...body,
      secret: encrypt(body.secret, argv.aesSecret),
      AppId: appId,
    });

  // Create in the cluster
  await updateNamespacedSecret(name, body.secret, app.path, String(appId));

  ctx.body = {
    authenticationMethod,
    id,
    identifier,
    name,
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

  assertKoaError(!app, ctx, 404, 'App not found');

  checkAppLock(ctx, app);
  await checkRole(ctx, app.OrganizationId, [Permission.EditApps, Permission.EditAppSettings]);

  const serviceSecrets = await AppServiceSecret.findAll({
    attributes: ['id', 'name', 'urlPatterns', 'authenticationMethod', 'identifier', 'tokenUrl'],
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
    attributes: ['OrganizationId', 'path'],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  checkAppLock(ctx, app);
  await checkRole(ctx, app.OrganizationId, [Permission.EditApps, Permission.EditAppSettings]);

  const appServiceSecret = await AppServiceSecret.findByPk(appServiceId);
  assertKoaError(!appServiceSecret, ctx, 404, 'Cannot find the app service secret to update');

  await appServiceSecret.update({
    ...body,
    secret: encrypt(body.secret, argv.aesSecret),
    AppId: appId,
  });

  const { authenticationMethod, id, identifier, name, tokenUrl, urlPatterns } = appServiceSecret;

  await updateNamespacedSecret(name, body.secret, app.path, String(appId));

  ctx.body = {
    authenticationMethod,
    id,
    name,
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
    attributes: ['OrganizationId', 'path'],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  checkAppLock(ctx, app);
  await checkRole(ctx, app.OrganizationId, [Permission.EditApps, Permission.EditAppSettings]);

  const appServiceSecret = await AppServiceSecret.findByPk(appServiceId);
  assertKoaError(!appServiceSecret, ctx, 404, 'Cannot find the app service secret to delete');

  await appServiceSecret.destroy();

  await deleteSecret(app.path, String(appId), appServiceSecret.name);

  ctx.status = 204;
}

export async function deleteAppServiceSecrets(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  checkAppLock(ctx, app);
  await checkRole(ctx, app.OrganizationId, [Permission.EditApps, Permission.EditAppSettings]);

  const appServiceSecrets = await AppServiceSecret.findAll({
    where: {
      AppId: appId,
    },
  });

  for (const appServiceSecret of appServiceSecrets) {
    await appServiceSecret.destroy();
  }

  ctx.status = 204;
}
