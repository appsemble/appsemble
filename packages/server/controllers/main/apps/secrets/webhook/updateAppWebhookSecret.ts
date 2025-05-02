import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App, getAppDB } from '../../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../../utils/authorization.js';
import { checkAppLock } from '../../../../../utils/checkAppLock.js';

export async function updateAppWebhookSecret(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, webhookSecretId },
    request: { body },
  } = ctx;
  const app = await App.findByPk(appId, { attributes: ['OrganizationId', 'path'] });
  assertKoaCondition(app != null, ctx, 404, 'App not found');

  checkAppLock(ctx, app);

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.UpdateAppSecrets],
  });

  assertKoaCondition(!body.secret, ctx, 401, 'Cannot update the secret directly');

  const { AppWebhookSecret } = await getAppDB(appId);
  const appWebhookSecret = await AppWebhookSecret.findByPk(webhookSecretId);
  assertKoaCondition(
    appWebhookSecret != null,
    ctx,
    404,
    'Cannot find the app webhook secret to update',
  );

  await appWebhookSecret.update(body);

  const { id, name, webhookName } = appWebhookSecret;

  ctx.body = {
    id,
    name,
    webhookName,
  };
}
