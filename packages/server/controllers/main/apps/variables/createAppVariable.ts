import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App, AppVariable } from '../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';
import { checkAppLock } from '../../../../utils/checkAppLock.js';

export async function createAppVariable(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: { body },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
  });

  assertKoaCondition(app != null, ctx, 404, 'App not found');

  checkAppLock(ctx, app);

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.CreateAppVariables],
  });

  const { name, value } = body;

  const existing = await AppVariable.findOne({
    where: {
      name,
      AppId: appId,
    },
  });

  assertKoaCondition(existing == null, ctx, 400, `App variable with name ${name} already exists`);

  const { id } = await AppVariable.create({
    name,
    value,
    AppId: appId,
  });

  ctx.body = { id, name, value };
}
