import { assertKoaError } from '@appsemble/node-utils';
import { PaymentProvider } from '@appsemble/types';
import { type Context } from 'koa';

import { App } from '../../../models/index.js';
import { getPaymentObject } from '../../../utils/payments/getPaymentObject.js';

export async function createAppCheckout(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    queryParams: { locale, price },
    request: {
      body: { email },
    },
  } = ctx;
  const app = await App.findByPk(appId);
  assertKoaError(!app, ctx, 404, 'App not found.');
  assertKoaError(
    !app!.successUrl || !app!.cancelUrl || !app!.stripeApiSecretKey || !app!.stripeWebhookSecret,
    ctx,
    404,
    'App is missing information required to process payments.',
  );
  const payments = await getPaymentObject(PaymentProvider.Stripe, appId);

  const checkout = await payments.createAppCheckout(
    price,
    app!.successUrl!,
    app!.cancelUrl!,
    locale,
    email,
  );

  ctx.body = {
    url: checkout.paymentUrl,
    checkoutId: checkout.id,
  };
}
