import { assertKoaError } from '@appsemble/node-utils';
import { MainPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppOAuth2Secret } from '../../../../../models/index.js';
import { checkUserPermissions } from '../../../../../utils/authorization.js';
import { checkAppLock } from '../../../../../utils/checkAppLock.js';

export async function deleteAppOAuth2Secrets(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  checkAppLock(ctx, app);
  await checkUserPermissions(ctx, app.OrganizationId, [MainPermission.DeleteAppSecrets]);

  const appOAuth2Secrets = await AppOAuth2Secret.findAll({
    where: {
      AppId: appId,
    },
  });

  for (const appOAuth2Secret of appOAuth2Secrets) {
    await appOAuth2Secret.destroy();
  }

  ctx.status = 204;
}
