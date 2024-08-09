import { assertKoaError } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App, AppVariable } from '../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';
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

  await checkUserOrganizationPermissions(ctx, app.OrganizationId, [
    OrganizationPermission.DeleteAppVariables,
  ]);

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
