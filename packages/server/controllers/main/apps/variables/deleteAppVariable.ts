import { assertKoaError } from '@appsemble/node-utils';
import { Permissions } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppVariable } from '../../../../models/index.js';
import { checkAppLock } from '../../../../utils/checkAppLock.js';
import { checkRole } from '../../../../utils/checkRole.js';

export async function deleteAppVariable(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, appVariableId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  checkAppLock(ctx, app);
  await checkRole(ctx, app.OrganizationId, [Permissions.EditApps, Permissions.EditAppSettings]);

  const appVariable = await AppVariable.findByPk(appVariableId);
  assertKoaError(!appVariable, ctx, 404, 'Cannot find the app variable to delete');

  await appVariable.destroy();

  ctx.status = 204;
}
