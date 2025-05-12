import { type SubscriptionRenewalPeriod } from '@appsemble/types';

import { type Invoice, type Organization } from '../../models/index.js';

export interface Payments {
  createOrUpdateCustomer: (organization: Partial<Organization>) => Promise<any>;

  createInvoice: (
    invoice: Invoice,
    customer: any,
    period: SubscriptionRenewalPeriod,
    initial?: boolean,
  ) => Promise<any>;

  chargeInvoice: (invoice: string) => Promise<any>;

  deletePaymentMethods: (customerId: any) => Promise<any>;
}
