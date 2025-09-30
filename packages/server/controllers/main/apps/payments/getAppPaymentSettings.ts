import { assertKoaError } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App } from '../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';

export async function getAppPaymentSettings(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
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

  assertKoaError(!app, ctx, 404, 'App not found');

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app!.OrganizationId,
    requiredPermissions: [OrganizationPermission.QueryAppSecrets],
  });

  const { cancelUrl, stripeApiSecretKey, stripeWebhookSecret, successUrl } = app!;

  ctx.body = {
    stripeApiSecretKey: Boolean(stripeApiSecretKey?.length),
    stripeWebhookSecret: Boolean(stripeWebhookSecret?.length),
    successUrl,
    cancelUrl,
    enablePayments: Boolean(stripeApiSecretKey || stripeWebhookSecret || successUrl || cancelUrl),
  };
}
