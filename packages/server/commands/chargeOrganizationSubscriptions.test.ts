import { InvoiceStatus, SubscriptionPlanType } from '@appsemble/types';
import dayjs from 'dayjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { chargeOrganizationSubscriptions } from './chargeOrganizationSubscriptions.js';
import { Invoice, Organization, OrganizationSubscription } from '../models/index.js';
import { type Mailer } from '../utils/email/Mailer.js';
import { type Payments } from '../utils/payments/payments.js';

describe('paymentRetries', () => {
  const now = new Date('2025-06-15T12:00:00.000Z');
  const mailerMock = {
    sendTranslatedEmail: vi.fn(() => Promise.resolve(null)),
  };
  let organization: Organization;
  let subscription: OrganizationSubscription;
  const customerId = 'cus_RMoF3DpETbqZL6';
  const invoiceId = 'in_1QU7dEIqNkYhnCOA3OaPMvuJ';
  const paymentUrl = 'testpaymenturl.com';

  const paymentsMock = {
    createOrUpdateCustomer: vi.fn(() => Promise.resolve(customerId)),
    createInvoice: vi.fn(() => Promise.resolve({ id: invoiceId, paymentUrl })),
    chargeInvoice: vi.fn(() => Promise.resolve(null)),
  };

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);

    organization = await Organization.create({
      id: 'testorganization',
      name: 'Test Organization',
      customerName: 'test customer',
      streetName: 'main street',
      houseNumber: '12',
      city: 'city',
      zipCode: '1234AB',
      countryCode: 'NL',
      vatIdNumber: null,
      stripeCustomerId: customerId,
      email: 'test+test_mode@test.test',
    });

    subscription = (await OrganizationSubscription.findOne({
      where: { OrganizationId: 'testorganization' },
    }))!;
    await subscription.update({
      subscriptionPlan: 'basic',
      expirationDate: dayjs(now).add(17, 'day'),
      cancelled: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should notify about subscription expiry', async () => {
    await subscription.update({
      expirationDate: String(dayjs(now).add(16, 'day')),
    });

    await chargeOrganizationSubscriptions(
      mailerMock as unknown as Mailer,
      paymentsMock as unknown as Payments,
    );

    expect(mailerMock.sendTranslatedEmail).toHaveBeenCalledWith({
      emailName: 'subscriptionNotice',
      locale: 'EN',
      to: {
        email: organization.email,
        name: organization.name,
      },
      values: {
        name: organization.name,
      },
    });
  });

  it('should not notify about subscription expiry for early or late dates', async () => {
    subscription = (await OrganizationSubscription.findOne({
      where: { OrganizationId: 'testorganization' },
    }))!;
    await subscription.update({
      expirationDate: String(dayjs(now).add(15, 'day')),
    });

    await chargeOrganizationSubscriptions(
      mailerMock as unknown as Mailer,
      paymentsMock as unknown as Payments,
    );

    expect(mailerMock.sendTranslatedEmail).not.toHaveBeenCalled();

    await subscription.update({
      expirationDate: String(dayjs(now).add(17, 'day')),
    });

    await chargeOrganizationSubscriptions(
      mailerMock as unknown as Mailer,
      paymentsMock as unknown as Payments,
    );

    expect(mailerMock.sendTranslatedEmail).not.toHaveBeenCalled();
  });

  it('should charge a subscription expiring in 14 days', async () => {
    await subscription.update({
      expirationDate: String(dayjs(now).add(14, 'day')),
    });

    await chargeOrganizationSubscriptions(null, paymentsMock as unknown as Payments);
    await organization.reload();

    expect(paymentsMock.createOrUpdateCustomer).toHaveBeenCalledWith(organization);
    expect(paymentsMock.createInvoice).toHaveBeenCalledOnce();
  });

  it('should not charge a subscription expiring in 15 days', async () => {
    await subscription.update({
      expirationDate: String(dayjs(now).add(15, 'day')),
    });

    await chargeOrganizationSubscriptions(null, paymentsMock as unknown as Payments);

    expect(paymentsMock.createOrUpdateCustomer).not.toHaveBeenCalled();
    expect(paymentsMock.createInvoice).not.toHaveBeenCalled();
  });

  it('should retry a failed invoice payment', async () => {
    await Invoice.create({
      subscriptionId: subscription.id,
      organizationId: organization.id,
      reference: organization.invoiceReference,
      amount: 10,
      vatIdNumber: organization.vatIdNumber,
      vatPercentage: '20',
      customerName: organization.name,
      subscriptionPlan: SubscriptionPlanType.Basic,
      customerStreetName: organization.streetName,
      customerHouseNumber: organization.houseNumber,
      customerCity: organization.city,
      customerZipCode: organization.zipCode,
      customerCountryCode: organization.countryCode,
      kvkNumber: 123,
      serviceSupplied: 'basic',
      activationDate: new Date(),
      invoiceNumberPrefix: 'test',
      stripeInvoiceId: invoiceId,
      invoiceStatus: InvoiceStatus.Retry,
    });

    await chargeOrganizationSubscriptions(null, paymentsMock as unknown as Payments);

    expect(paymentsMock.chargeInvoice).toHaveBeenCalledWith(invoiceId);
  });

  it('should not retry an invoice payment', async () => {
    await Invoice.create({
      subscriptionId: subscription.id,
      organizationId: organization.id,
      reference: organization.invoiceReference,
      amount: 10,
      vatIdNumber: organization.vatIdNumber,
      vatPercentage: '20',
      customerName: organization.name,
      subscriptionPlan: SubscriptionPlanType.Basic,
      customerStreetName: organization.streetName,
      customerHouseNumber: organization.houseNumber,
      customerCity: organization.city,
      customerZipCode: organization.zipCode,
      customerCountryCode: organization.countryCode,
      kvkNumber: 123,
      serviceSupplied: 'basic',
      activationDate: new Date(),
      invoiceNumberPrefix: 'test',
      stripeInvoiceId: '1',
      invoiceStatus: InvoiceStatus.Failed,
    });

    await Invoice.create({
      subscriptionId: subscription.id,
      organizationId: organization.id,
      invoice: organization.invoiceReference,
      amount: 10,
      vatIdNumber: organization.vatIdNumber,
      vatPercentage: '20',
      customerName: organization.name,
      subscriptionPlan: SubscriptionPlanType.Basic,
      customerStreetName: organization.streetName,
      customerHouseNumber: organization.houseNumber,
      customerCity: organization.city,
      customerZipCode: organization.zipCode,
      customerCountryCode: organization.countryCode,
      kvkNumber: 123,
      serviceSupplied: 'basic',
      activationDate: new Date(),
      invoiceNumberPrefix: 'test',
      stripeInvoiceId: '2',
      invoiceStatus: InvoiceStatus.Pending,
    });

    await Invoice.create({
      subscriptionId: subscription.id,
      organizationId: organization.id,
      reference: organization.invoiceReference,
      amount: 10,
      vatIdNumber: organization.vatIdNumber,
      vatPercentage: '20',
      customerName: organization.name,
      subscriptionPlan: SubscriptionPlanType.Basic,
      customerStreetName: organization.streetName,
      customerHouseNumber: organization.houseNumber,
      customerCity: organization.city,
      customerZipCode: organization.zipCode,
      customerCountryCode: organization.countryCode,
      kvkNumber: 123,
      serviceSupplied: 'basic',
      activationDate: new Date(),
      invoiceNumberPrefix: 'test',
      stripeInvoiceId: '3',
      invoiceStatus: InvoiceStatus.Paid,
    });

    await chargeOrganizationSubscriptions(null, paymentsMock as unknown as Payments);

    expect(paymentsMock.chargeInvoice).not.toHaveBeenCalled();
  });
});
