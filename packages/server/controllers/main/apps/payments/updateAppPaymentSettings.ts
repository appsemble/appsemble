import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App } from '../../../../models/index.js';
import { argv } from '../../../../utils/argv.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';
import { checkAppLock } from '../../../../utils/checkAppLock.js';
import { encrypt } from '../../../../utils/crypto.js';

export async function updateAppPaymentSettings(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: { cancelUrl, enablePayments, stripeApiSecretKey, stripeWebhookSecret, successUrl },
    },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: [
      'stripeApiSecretKey',
      'stripeWebhookSecret',
      'successUrl',
      'cancelUrl',
      'id',
      'OrganizationId',
    ],
  });

  assertKoaCondition(app != null, ctx, 404, 'App not found');

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.ReadAppSettings],
  });

  checkAppLock(ctx, app);

  const result: Partial<App> = {};

  if (enablePayments === 'false') {
    result.stripeWebhookSecret = null;
    result.stripeApiSecretKey = null;
    result.cancelUrl = null;
    result.successUrl = null;
  } else {
    if (stripeWebhookSecret !== undefined) {
      result.stripeWebhookSecret = stripeWebhookSecret.length
        ? encrypt(stripeWebhookSecret, argv.aesSecret)
        : undefined;
    }

    if (stripeApiSecretKey !== undefined) {
      result.stripeApiSecretKey = stripeApiSecretKey.length
        ? encrypt(stripeApiSecretKey, argv.aesSecret)
        : undefined;
    }

    if (cancelUrl !== undefined) {
      result.cancelUrl = cancelUrl;
    }

    if (successUrl !== undefined) {
      result.successUrl = successUrl;
    }
  }
  await app.update(result, { where: { id: appId } });
  ctx.body = {
    stripeApiSecretKey: Boolean(app.stripeApiSecretKey?.length),
    stripeWebhookSecret: Boolean(app.stripeWebhookSecret?.length),
    successUrl: app.successUrl,
    cancelUrl: app.cancelUrl,
    enablePayments: Boolean(
      result.stripeApiSecretKey ||
        result.stripeWebhookSecret ||
        result.successUrl ||
        result.cancelUrl,
    ),
  };
}
