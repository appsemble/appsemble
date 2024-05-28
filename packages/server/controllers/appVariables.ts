import { assertKoaError, createGetAppVariables } from '@appsemble/node-utils';
import { Permission } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppVariable } from '../models/index.js';
import { options } from '../options/options.js';
import { checkAppLock } from '../utils/checkAppLock.js';
import { checkRole } from '../utils/checkRole.js';

export async function createAppVariable(ctx: Context): Promise<void> {
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

  const { name, value } = body;

  const existing = await AppVariable.findOne({
    where: {
      name,
      AppId: appId,
    },
  });

  assertKoaError(existing != null, ctx, 400, `App variable with name ${name} already exists`);

  const { id } = await AppVariable.create({
    name,
    value,
    AppId: appId,
  });

  ctx.body = { id, name, value };
}

export const getAppVariables = createGetAppVariables(options);

export async function updateAppVariable(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, appVariableId },
    request: { body },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  checkAppLock(ctx, app);
  await checkRole(ctx, app.OrganizationId, [Permission.EditApps, Permission.EditAppSettings]);

  if (body.name) {
    const { name } = body;
    const existing = await AppVariable.findOne({
      where: {
        name,
        AppId: appId,
      },
    });

    assertKoaError(existing != null, ctx, 400, `App variable with name ${name} already exists`);
  }

  const appVariable = await AppVariable.findByPk(appVariableId);
  assertKoaError(!appVariable, ctx, 404, 'Cannot find the app variable to update');

  await appVariable.update({
    ...body,
    AppId: appId,
  });

  const { id, name, value } = appVariable;

  ctx.body = {
    id,
    name,
    value,
  };
}

export async function deleteAppVariable(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, appVariableId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  checkAppLock(ctx, app);
  await checkRole(ctx, app.OrganizationId, [Permission.EditApps, Permission.EditAppSettings]);

  const appVariable = await AppVariable.findByPk(appVariableId);
  assertKoaError(!appVariable, ctx, 404, 'Cannot find the app variable to delete');

  await appVariable.destroy();

  ctx.status = 204;
}

export async function deleteAppVariables(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  checkAppLock(ctx, app);
  await checkRole(ctx, app.OrganizationId, [Permission.EditApps, Permission.EditAppSettings]);

  const appVariables = await AppVariable.findAll({
    where: {
      AppId: appId,
    },
  });

  for (const appVariable of appVariables) {
    await appVariable.destroy();
  }

  ctx.status = 204;
}
