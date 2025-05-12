import { PaymentProvider } from '@appsemble/types';

import { type Payments } from './payments.js';
import { StripePayments } from './stripe/stripePayments.js';

export function getPaymentObject(paymentProvider: PaymentProvider): Payments {
  switch (paymentProvider) {
    case PaymentProvider.Stripe:
      return new StripePayments();
    default:
      throw new Error('Unknown payment provider.');
  }
}
