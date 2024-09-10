import { assertKoaError } from '@appsemble/node-utils';
import { Permissions } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppVariable } from '../../../../models/index.js';
import { checkAppLock } from '../../../../utils/checkAppLock.js';
import { checkRole } from '../../../../utils/checkRole.js';

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
  await checkRole(ctx, app.OrganizationId, [Permissions.EditApps, Permissions.EditAppSettings]);

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
