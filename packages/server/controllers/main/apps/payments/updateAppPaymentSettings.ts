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
      body: { cancelUrl, stripeApiKey, stripeSecret, successUrl },
    },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['stripeApiKey', 'stripeSecret', 'successUrl', 'cancelUrl', 'id', 'OrganizationId'],
  });

  assertKoaCondition(app != null, ctx, 404, 'App not found');

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.ReadAppSettings],
  });

  checkAppLock(ctx, app);

  const result: Partial<App> = {};

  if (stripeSecret !== undefined) {
    result.stripeSecret = stripeSecret.length ? encrypt(stripeSecret, argv.aesSecret) : undefined;
  }

  if (stripeApiKey !== undefined) {
    result.stripeApiKey = stripeApiKey.length ? encrypt(stripeApiKey, argv.aesSecret) : undefined;
  }

  if (cancelUrl !== undefined) {
    result.cancelUrl = cancelUrl;
  }

  if (successUrl !== undefined) {
    result.successUrl = successUrl;
  }
  await app.update(result, { where: { id: appId } });

  ctx.body = {
    stripeApiKey: Boolean(app.stripeApiKey?.length),
    stripeSecret: Boolean(app.stripeSecret?.length),
    successUrl: app.successUrl,
    cancelUrl: app.cancelUrl,
  };
}
