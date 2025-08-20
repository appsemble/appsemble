import { readFileSync, writeFileSync } from 'node:fs';
import { beforeEach } from 'node:test';

import { PaymentMethod, SubscriptionPlanType, SubscriptionRenewalPeriod } from '@appsemble/types';
import { Decimal } from 'decimal.js';
import Stripe from 'stripe';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { StripePayments } from './stripePayments.js';
import {
  Invoice,
  type Organization,
  type OrganizationSubscription,
} from '../../../models/index.js';
import { argv } from '../../argv.js';
import { type PricingInfo } from '../../calculateVat.js';
import { type Payments } from '../payments.js';

let organization: Partial<Organization>;
let customer: Stripe.Customer;
let invoice: Invoice;
let subscription: Partial<OrganizationSubscription>;
let pricingInformation: PricingInfo;
let stripeInvoice: Stripe.Checkout.Session;
let payments: Payments;
let stripeMock: any;

describe('stripePayments', () => {
  beforeAll(async () => {
    organization = {
      name: 'test customer',
      streetName: 'main street',
      houseNumber: '12',
      email: 'test+test_mode@test.test',
      city: 'city',
      zipCode: '1234AB',
      countryCode: 'NL',
      stripeCustomerId: undefined,
    };

    subscription = {
      id: 1,
    };

    pricingInformation = {
      totalPrice: '115.00',
      activeSubscriptionDiscount: '0.00',
      basePrice: '100',
      couponDiscount: '0.00',
      vatPercentage: '0.15',
      vatAmount: '15.00',
      priceWithCoupon: '100.00',
    };

    invoice = new Invoice({
      id: 1,
      subscriptionId: subscription.id,
      organizationId: organization.id,
      reference: organization.invoiceReference,
      amount: pricingInformation.basePrice,
      vatIdNumber: organization.vatIdNumber,
      vatPercentage: new Decimal(pricingInformation.vatPercentage).mul(100).toNumber(),
      customerName: organization.name,
      subscriptionPlan: SubscriptionPlanType.Basic,
      customerStreetName: organization.streetName,
      customerHouseNumber: organization.houseNumber,
      customerCity: organization.city,
      customerZipCode: organization.zipCode,
      customerCountryCode: organization.countryCode,
      kvkNumber: 123,
      serviceSupplied: SubscriptionPlanType.Basic,
      activationDate: new Date(),
      invoiceNumberPrefix: 'test',
    });

    stripeMock = {
      customers: {
        create: vi.fn(() => Promise.resolve(customer)),
        update: vi.fn(() => Promise.resolve(customer)),
        retrieve: vi.fn(() => Promise.resolve(customer)),
      },
      setupIntents: {
        create: vi.fn(),
      },
      invoiceItems: {
        create: vi.fn(),
      },
      invoices: {
        pay: vi.fn(),
      },
      checkout: {
        sessions: {
          create: vi.fn(() => Promise.resolve(stripeInvoice)),
          finalizeInvoice: vi.fn(() =>
            Promise.resolve({ id: stripeInvoice.id, paymentUrl: 'paymentUrl' }),
          ),
        },
      },
    };
    payments = new StripePayments(argv.stripeApiKey, stripeMock as unknown as Stripe);
    if (argv.updateStripeResponses) {
      const stripe = new Stripe(argv.stripeApiKey);

      const customerCreateParams = {
        name: organization.name,
        address: {
          line1: `${organization.houseNumber} ${organization.streetName}`,
          city: organization.city,
          postal_code: organization.zipCode,
          country: organization.countryCode,
        },
        email: 'test+test_mode@test.test',
      };
      customer = await stripe.customers.create(customerCreateParams);
      writeFileSync(
        'packages/server/stripe-responses/stripe-customer.json',
        JSON.stringify(customer, null, 2),
      );

      const createInvoiceParams: Stripe.Checkout.SessionCreateParams = {
        mode: 'payment',
        metadata: {
          id: invoice.id,
          initial: String(true),
        },
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: '1 month of basic subscription',
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
                .toNumber(),
            },
            quantity: 1,
          },
        ],
        customer: customer.id,
        payment_method_types: Object.values(PaymentMethod),
        locale: 'auto',
        success_url: `${argv.host}/organizations/${invoice.organizationId}/subscriptions/success/${invoice.subscriptionPlan}`,
      };

      stripeInvoice = await stripe.checkout.sessions.create(createInvoiceParams);

      writeFileSync(
        'packages/server/stripe-responses/stripe-invoice.json',
        JSON.stringify(stripeInvoice, null, 2),
      );
    } else {
      customer = JSON.parse(
        readFileSync('packages/server/stripe-responses/stripe-customer.json', 'utf8'),
      );
      stripeInvoice = JSON.parse(
        readFileSync('packages/server/stripe-responses/stripe-invoice.json', 'utf8'),
      );
    }
  });

  beforeEach(() => {
    organization = {
      name: 'test customer',
      streetName: 'main street',
      houseNumber: '12',
      city: 'city',
      zipCode: '1234AB',
      countryCode: 'NL',
      stripeCustomerId: undefined,
      email: 'test+test_mode@test.test',
    };
  });

  it('should create a new customer', async () => {
    const response = await payments.createOrUpdateCustomer(organization);
    expect(response).toMatch(customer.id);
    expect(stripeMock.customers.create).toHaveBeenCalledWith({
      address: {
        city: organization.city,
        country: organization.countryCode,
        line1: `${organization.houseNumber} ${organization.streetName}`,
        postal_code: organization.zipCode,
      },
      name: organization.name,
      email: 'test+test_mode@test.test',
    });
  });

  it('should not update an existing customer', async () => {
    organization.stripeCustomerId = customer.id;
    await payments.createOrUpdateCustomer(organization);
    expect(stripeMock.customers.update).not.toHaveBeenCalled();
  });

  it('should update an existing customer', async () => {
    organization.stripeCustomerId = customer.id;
    organization.city = 'new city';
    organization.name = 'new name';
    await payments.createOrUpdateCustomer(organization);
    expect(stripeMock.customers.update).toHaveBeenCalledWith(customer.id, {
      address: {
        city: organization.city,
        country: organization.countryCode,
        line1: `${organization.houseNumber} ${organization.streetName}`,
        postal_code: organization.zipCode,
      },
      name: organization.name,
    });
  });

  it('should create a new checkout session', async () => {
    const response = await payments.createInvoice(
      invoice,
      organization,
      SubscriptionRenewalPeriod.Month,
    );
    expect(response).toStrictEqual({
      id: stripeInvoice.id,
      paymentUrl: stripeInvoice.url,
    });
    expect(stripeMock.checkout.sessions.create).toHaveBeenCalledWith({
      cancel_url: `${argv.host}/organizations/undefined/subscriptions/failure`,
      customer: organization.stripeCustomerId,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: '1 month extension of basic subscription',
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
              .toNumber(),
          },
          quantity: 1,
        },
      ],
      locale: 'auto',
      metadata: {
        id: invoice.id,
        initial: 'false',
      },
      mode: 'payment',
      payment_method_types: Object.values(PaymentMethod),
      success_url: `${argv.host}/organizations/undefined/subscriptions/success/basic`,
    });
  });

  it('should charge an existing invoice', async () => {
    await payments.chargeInvoice(stripeInvoice.id);
    expect(stripeMock.invoices.pay).toHaveBeenCalledWith(stripeInvoice.id);
  });
});
