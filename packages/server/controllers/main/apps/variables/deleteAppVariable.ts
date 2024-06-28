import { assertKoaError } from '@appsemble/node-utils';
import { MainPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppVariable } from '../../../../models/index.js';
import { checkUserPermissions } from '../../../../utils/authorization.js';
import { checkAppLock } from '../../../../utils/checkAppLock.js';

export async function deleteAppVariable(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, appVariableId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  checkAppLock(ctx, app);

  await checkUserPermissions(ctx, app.OrganizationId, [MainPermission.DeleteAppVariables]);

  const appVariable = await AppVariable.findByPk(appVariableId);
  assertKoaError(!appVariable, ctx, 404, 'Cannot find the app variable to delete');

  await appVariable.destroy();

  ctx.status = 204;
}
