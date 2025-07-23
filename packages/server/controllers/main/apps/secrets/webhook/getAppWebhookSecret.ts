import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App, getAppDB } from '../../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../../utils/authorization.js';
import { checkAppLock } from '../../../../../utils/checkAppLock.js';

export async function getAppWebhookSecret(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, webhookSecretId },
  } = ctx;
  const app = await App.findByPk(appId, { attributes: ['OrganizationId'] });
  assertKoaCondition(app != null, ctx, 404, 'App not found');

  checkAppLock(ctx, app);

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.QueryAppSecrets],
  });

  const { AppWebhookSecret } = await getAppDB(appId);
  const webhookSecret = await AppWebhookSecret.findByPk(webhookSecretId, {
    attributes: ['secret'],
  });

  assertKoaCondition(webhookSecret != null, ctx, 404, 'Webhook secret not found');

  ctx.body = {
    secret: webhookSecret.secret.toString('hex'),
  };
}
