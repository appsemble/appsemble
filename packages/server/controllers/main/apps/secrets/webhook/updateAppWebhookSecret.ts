import { assertKoaError } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App, AppWebhookSecret } from '../../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../../utils/authorization.js';
import { checkAppLock } from '../../../../../utils/checkAppLock.js';

export async function updateAppWebhookSecret(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, webhookSecretId },
    request: { body },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId', 'path'],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  checkAppLock(ctx, app);

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.UpdateAppSecrets],
  });

  assertKoaError(body.secret, ctx, 401, 'Cannot update the secret directly');

  const appWebhookSecret = await AppWebhookSecret.findByPk(webhookSecretId);
  assertKoaError(!appWebhookSecret, ctx, 404, 'Cannot find the app webhook secret to update');

  await appWebhookSecret.update({
    ...body,
    AppId: appId,
  });

  const { id, name } = appWebhookSecret;

  ctx.body = {
    id,
    name,
  };
}
