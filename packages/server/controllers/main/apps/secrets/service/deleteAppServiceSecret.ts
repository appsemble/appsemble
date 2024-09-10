import { assertKoaError, deleteSecret } from '@appsemble/node-utils';
import { Permission } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppServiceSecret } from '../../../../../models/index.js';
import { checkAppLock } from '../../../../../utils/checkAppLock.js';
import { checkRole } from '../../../../../utils/checkRole.js';

export async function deleteAppServiceSecret(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, serviceSecretId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId', 'path'],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  checkAppLock(ctx, app);
  await checkRole(ctx, app.OrganizationId, [Permission.EditApps, Permission.EditAppSettings]);

  const appServiceSecret = await AppServiceSecret.findByPk(serviceSecretId);
  assertKoaError(!appServiceSecret, ctx, 404, 'Cannot find the app service secret to delete');

  await appServiceSecret.destroy();

  await deleteSecret(app.path, String(appId), appServiceSecret.name);

  ctx.status = 204;
}
