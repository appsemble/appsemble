import { PaymentProvider } from '@appsemble/types';

import { type Payments } from './payments.js';
import { StripePayments } from './stripe/stripePayments.js';
import { App } from '../../models/main/App.js';
import { argv } from '../../utils/argv.js';
import { decrypt } from '../crypto.js';

export async function getPaymentObject(
  paymentProvider: PaymentProvider,
  appId?: number,
): Promise<Payments> {
  let apiKey;
  if (appId === -1 || !appId) {
    apiKey = argv.stripeApiSecretKey;
  } else {
    const app = await App.findByPk(appId, {
      attributes: ['stripeWebhookSecret', 'stripeApiSecretKey'],
    });
    apiKey = app ? decrypt(app.stripeApiSecretKey!, argv.aesSecret) : undefined;
  }
  if (!apiKey) {
    throw new Error('Missing API key');
  }
  switch (paymentProvider) {
    case PaymentProvider.Stripe:
      return new StripePayments(apiKey);
    default:
      throw new Error('Unknown payment provider.');
  }
}
