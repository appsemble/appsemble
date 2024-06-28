import { assertKoaError } from '@appsemble/node-utils';
import { MainPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppVariable } from '../../../../models/index.js';
import { checkUserPermissions } from '../../../../utils/authorization.js';
import { checkAppLock } from '../../../../utils/checkAppLock.js';

export async function deleteAppVariables(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  checkAppLock(ctx, app);

  await checkUserPermissions(ctx, app.OrganizationId, [MainPermission.DeleteAppVariables]);

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
