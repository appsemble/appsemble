import { assertKoaCondition, deleteSecret } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App, AppServiceSecret } from '../../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../../utils/authorization.js';
import { checkAppLock } from '../../../../../utils/checkAppLock.js';

export async function deleteAppServiceSecret(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, serviceSecretId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId', 'path'],
  });

  assertKoaCondition(!!app, ctx, 404, 'App not found');

  checkAppLock(ctx, app);

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.DeleteAppSecrets],
  });

  const appServiceSecret = await AppServiceSecret.findByPk(serviceSecretId);
  assertKoaCondition(!!appServiceSecret, ctx, 404, 'Cannot find the app service secret to delete');

  await appServiceSecret.destroy();

  await deleteSecret(app.path, String(appId), appServiceSecret.name);

  ctx.status = 204;
}
