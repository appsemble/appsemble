import { randomBytes } from 'node:crypto';

import { assertKoaError } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App, AppWebhookSecret } from '../../../../../models/index.js';
import { argv } from '../../../../../utils/argv.js';
import { checkUserOrganizationPermissions } from '../../../../../utils/authorization.js';
import { checkAppLock } from '../../../../../utils/checkAppLock.js';
import { encrypt } from '../../../../../utils/crypto.js';

export async function createAppWebhookSecret(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: { body },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId', 'path', 'definition'],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  checkAppLock(ctx, app);

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.CreateAppSecrets],
  });

  assertKoaError(!body.webhookName, ctx, 400, 'Webhook name is required');

  assertKoaError(
    !Object.keys(app.definition.webhooks).includes(body.webhookName),
    ctx,
    400,
    'Webhook does not exist in the app definition',
  );

  const { id, name, webhookName } = await AppWebhookSecret.create({
    ...body,
    secret: encrypt(randomBytes(40).toString('hex'), argv.aesSecret),
    AppId: appId,
  });

  ctx.body = {
    id,
    name,
    webhookName,
  };
}
