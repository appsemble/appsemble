import { logger } from '@appsemble/node-utils';
import { PaymentMethod, SubscriptionRenewalPeriod } from '@appsemble/types';
import { Decimal } from 'decimal.js';
import { isEqual, pickBy } from 'lodash-es';
import Stripe from 'stripe';

import { type Invoice } from '../../../models/Invoice.js';
import { type Organization } from '../../../models/Organization.js';
import { argv } from '../../argv.js';
import { parseAddress } from '../../parseAddress.js';
import { type Payments } from '../payments.js';

interface OrganizationComparisonFields {
  /**
   * Street name for the organization location.
   */
  streetName: string | null | undefined;

  /**
   * House number for the organization location.
   */
  houseNumber: string | null | undefined;

  /**
   * City for the organization location.
   */
  city: string | null | undefined;

  /**
   * Zip code for the organization location.
   */
  zipCode: string | null | undefined;

  /**
   * Country code for the organization location.
   */
  countryCode: string | null | undefined;

  /**
   * Customer name of the organization.
   */
  name: string | null | undefined;

  /**
   * Email of the organization.
   */
  email: string | null;
}

export class StripePayments implements Payments {
  stripe: Stripe;

  constructor(stripeApiKey: string, stripe?: Stripe) {
    this.stripe = stripe || new Stripe(stripeApiKey);
  }

  async createOrUpdateCustomer(organization: Partial<Organization>): Promise<any> {
    let customer;
    try {
      if (!organization.stripeCustomerId) {
        throw new Stripe.errors.StripeInvalidRequestError({
          type: 'invalid_request_error',
          code: 'resource_missing',
        });
      }
      const customerResponse = await this.stripe.customers.retrieve(organization.stripeCustomerId);
      if (customerResponse.deleted) {
        throw new Stripe.errors.StripeInvalidRequestError({
          type: 'invalid_request_error',
          code: 'resource_missing',
        });
      } else {
        customer = customerResponse as Stripe.Customer;
      }
      const { houseNumber, streetName } = parseAddress(customer?.address?.line1);
      const filteredCustomer: OrganizationComparisonFields = {
        streetName,
        houseNumber,
        city: customer?.address?.city,
        zipCode: customer?.address?.postal_code,
        countryCode: customer.address?.country,
        name: customer?.name,
        email: customer.email,
      };
      const difference = pickBy(
        filteredCustomer,
        (value: string | null | undefined, key: string) =>
          !isEqual(organization[key as keyof Organization], value),
      );
      if (Object.keys(difference).length !== 0) {
        const updateFields: Record<string, any> = {};
        if (
          'streetName' in difference ||
          'houseNumber' in difference ||
          'city' in difference ||
          'zipCode' in difference ||
          'country' in difference ||
          'email' in difference
        ) {
          updateFields.address = {};
          updateFields.address.line1 = `${organization.houseNumber} ${organization.streetName}`;
          updateFields.address.city = organization.city;
          updateFields.address.postal_code = organization.zipCode;
          updateFields.address.country = organization.countryCode;
        }
        if ('name' in difference) {
          updateFields.name = organization.name;
        }
        if ('email' in difference) {
          updateFields.email = organization.email;
        }
        customer = await this.stripe.customers.update(organization.stripeCustomerId, {
          ...updateFields,
        });
      }
    } catch (error: any) {
      if (error?.raw?.code === 'resource_missing') {
        customer = await this.stripe.customers.create({
          name: organization.name,
          email: organization.email,
          address: {
            line1: `${organization.houseNumber} ${organization.streetName}`,
            city: organization.city,
            postal_code: organization.zipCode,
            country: organization.countryCode,
          },
        });
      }
    }
    return customer?.id;
  }

  async createInvoice(
    invoice: Invoice,
    organization: Organization,
    period: SubscriptionRenewalPeriod,
    initial = false,
  ): Promise<any> {
    let checkoutSession;
    try {
      let description = '';
      if (period) {
        description += `${period === SubscriptionRenewalPeriod.Year ? '12' : '1'} month extension of ${invoice.subscriptionPlan} subscription`;
      }

      if (new Decimal(invoice.amount).greaterThan(0)) {
        checkoutSession = await this.stripe.checkout.sessions.create({
          mode: 'payment',
          metadata: {
            id: invoice.id,
            initial: String(initial),
          },
          line_items: [
            {
              price_data: {
                currency: 'eur',
                product_data: {
                  name: description,
                },
                unit_amount: new Decimal(invoice.amount).mul(100).toNumber(),
              },
              quantity: 1,
            },
            {
              price_data: {
                currency: 'eur',
                product_data: {
                  name: 'VAT',
                },
                unit_amount: new Decimal(invoice.vatPercentage)
                  .mul(new Decimal(invoice.amount))
                  .toDecimalPlaces(0)
                  .toNumber(),
              },
              quantity: 1,
            },
          ],
          customer: organization.stripeCustomerId,
          payment_method_types: Object.values(PaymentMethod),
          locale: 'auto',
          success_url: `${argv.host}/organizations/${invoice.organizationId}/subscriptions/success/${invoice.subscriptionPlan}`,
          cancel_url: `${argv.host}/organizations/${invoice.organizationId}/subscriptions/failure`,
        });
        return { id: checkoutSession.id, paymentUrl: checkoutSession?.url };
      }
      checkoutSession = await this.stripe.checkout.sessions.create({
        mode: 'setup',
        metadata: {
          id: invoice.id,
          initial: String(initial),
        },
        customer: organization.stripeCustomerId,
        payment_method_types: Object.values(PaymentMethod),
        locale: 'auto',
        success_url: `${argv.host}/organizations/${invoice.organizationId}/subscriptions/success/${invoice.subscriptionPlan}`,
        cancel_url: `${argv.host}/organizations/${invoice.organizationId}/subscriptions/failure`,
      });
      return { id: checkoutSession.id, paymentUrl: checkoutSession.url };
    } catch {
      return { id: checkoutSession?.id, paymentUrl: checkoutSession?.url };
    }
  }

  async chargeInvoice(invoice: string): Promise<void> {
    try {
      await this.stripe.invoices.pay(invoice);
    } catch {
      logger.info('Something went wrong charging this invoice.');
    }
  }

  async deletePaymentMethods(customerId: any): Promise<void> {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({ customer: customerId });
      for (const paymentMethod of paymentMethods.data) {
        this.stripe.paymentMethods.detach(paymentMethod.id);
      }
    } catch {
      logger.info('Something went wrong deleting associated payment methods.');
    }
  }

  async createAppCheckout(priceId: string, successUrl: string, cancelUrl: string): Promise<any> {
    let checkoutSession;

    const price = await this.stripe.prices.retrieve(priceId, {
      expand: ['product'],
    });
    const product = price.product as Stripe.Product;
    const mode = price.type === 'recurring' ? 'subscription' : 'payment';
    try {
      checkoutSession = await this.stripe.checkout.sessions.create({
        mode,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        metadata: { product: product.name },
        locale: 'auto',
        success_url: successUrl,
        cancel_url: cancelUrl,
        tax_id_collection: { enabled: true },
      });
      return { id: checkoutSession.id, paymentUrl: checkoutSession?.url };
    } catch {
      return { id: checkoutSession?.id, paymentUrl: checkoutSession?.url };
    }
  }
}
