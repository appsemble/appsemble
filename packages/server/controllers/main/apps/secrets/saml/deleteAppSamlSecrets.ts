import { assertKoaError } from '@appsemble/node-utils';
import { MainPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppSamlSecret } from '../../../../../models/index.js';
import { checkUserPermissions } from '../../../../../utils/authorization.js';
import { checkAppLock } from '../../../../../utils/checkAppLock.js';

export async function deleteAppSamlSecrets(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  checkAppLock(ctx, app);

  await checkUserPermissions(ctx, app.OrganizationId, [MainPermission.DeleteAppSecrets]);

  const appServiceSecrets = await AppSamlSecret.findAll({
    where: {
      AppId: appId,
    },
  });

  for (const appServiceSecret of appServiceSecrets) {
    await appServiceSecret.destroy();
  }

  ctx.status = 204;
}
