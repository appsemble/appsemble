import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App, AppVariable } from '../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';
import { checkAppLock } from '../../../../utils/checkAppLock.js';

export async function deleteAppVariable(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, appVariableId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
  });

  assertKoaCondition(!!app, ctx, 404, 'App not found');

  checkAppLock(ctx, app);

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.DeleteAppVariables],
  });

  const appVariable = await AppVariable.findByPk(appVariableId);
  assertKoaCondition(!!appVariable, ctx, 404, 'Cannot find the app variable to delete');

  await appVariable.destroy();

  ctx.status = 204;
}
