import { assertKoaError } from '@appsemble/node-utils';
import { Permissions } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppVariable } from '../../../../models/index.js';
import { checkAppLock } from '../../../../utils/checkAppLock.js';
import { checkRole } from '../../../../utils/checkRole.js';

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
  await checkRole(ctx, app.OrganizationId, [Permissions.EditApps, Permissions.EditAppSettings]);

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
