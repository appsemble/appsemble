import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App, AppWebhookSecret } from '../../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../../utils/authorization.js';
import { checkAppLock } from '../../../../../utils/checkAppLock.js';

export async function deleteAppWebhookSecret(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, webhookSecretId },
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

  const appWebhookSecret = await AppWebhookSecret.findByPk(webhookSecretId);
  assertKoaCondition(!!appWebhookSecret, ctx, 404, 'Cannot find the app webhook secret to delete');

  await appWebhookSecret.destroy();

  ctx.status = 204;
}
