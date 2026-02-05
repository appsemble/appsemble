import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import type Koa from 'koa';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { Invoice, Organization, OrganizationMember, type User } from '../../../models/index.js';
import { setArgv } from '../../../utils/argv.js';
import { createServer } from '../../../utils/createServer.js';
import { getPaymentObject } from '../../../utils/payments/getPaymentObject.js';
import { authorizeStudio, createTestUser } from '../../../utils/test/authorization.js';

let organization: Organization;
let server: Koa;
let user: User;
const customerId = 'cus_RMoF3DpETbqZL6';
const invoiceId = 'in_1QU7dEIqNkYhnCOA3OaPMvuJ';
const paymentUrl = 'testpaymenturl.com';

vi.mock('../../../utils/payments/getPaymentObject.js', () => {
  const paymentsMock = {
    createOrUpdateCustomer: vi.fn(() => Promise.resolve(customerId)),
    createInvoice: vi.fn(() => Promise.resolve({ id: invoiceId, paymentUrl })),
  };
  return { getPaymentObject: vi.fn(() => Promise.resolve(paymentsMock)) };
});

describe('sendInvoice', () => {
  beforeAll(async () => {
    setArgv({ host: 'http://localhost', secret: 'test' });
    server = await createServer();
    await setTestApp(server);
  });

  beforeEach(async () => {
    vi.restoreAllMocks();

    user = await createTestUser();
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
      stripeCustomerId: null,
    });
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });
  });

  afterEach(() => {
    vi.mocked(getPaymentObject).mockResolvedValue({
      createOrUpdateCustomer: vi.fn(() => Promise.resolve(customerId)),
      createInvoice: vi.fn(() => Promise.resolve({ id: invoiceId, paymentUrl })),
      chargeInvoice: vi.fn(() => Promise.resolve(null)),
      deletePaymentMethods: vi.fn(() => Promise.resolve(null)),
      createAppCheckout: vi.fn(() => Promise.resolve(null)),
    });
  });

  it('should send an invoice for a subscription', async () => {
    authorizeStudio();
    const response = await request.post(
      `/api/payments/send-invoice?organizationId=${organization.id}&subscriptionType=basic&period=month`,
    );

    expect(response).toMatchObject({
      status: 200,
    });
    organization = (await Organization.findOne())!;
    expect(organization.stripeCustomerId).toStrictEqual(customerId);
    const invoice = await Invoice.findOne();
    expect(invoice!.stripeInvoiceId).toStrictEqual(invoiceId);
  }, 30_000);

  it('should not send an invoice for non-existing organization', async () => {
    authorizeStudio();
    const response = await request.post(
      '/api/payments/send-invoice?organizationId=wrong&subscriptionType=basic&period=month',
    );

    expect(response).toMatchObject({
      status: 404,
      data: {
        message: 'Organization not found.',
      },
    });
  });

  it('should not send an invoice when missing billing information', async () => {
    authorizeStudio();
    organization.update({ countryCode: null });
    const response = await request.post(
      `/api/payments/send-invoice?organizationId=${organization.id}&subscriptionType=basic&period=month`,
    );

    expect(response).toMatchObject({
      status: 500,
      data: {
        message: 'Something went wrong while creating invoice.',
      },
    });
  });

  it('should handle undefined response from payment interface', async () => {
    authorizeStudio();
    vi.mocked(getPaymentObject).mockResolvedValue({
      createOrUpdateCustomer: vi.fn(() => Promise.resolve(null)),
      createInvoice: vi.fn(() => Promise.resolve({ id: invoiceId, paymentUrl })),
      chargeInvoice: vi.fn(() => Promise.resolve(null)),
      deletePaymentMethods: vi.fn(() => Promise.resolve(null)),
      createAppCheckout: vi.fn(() => Promise.resolve(null)),
    });
    const response = await request.post(
      `/api/payments/send-invoice?organizationId=${organization.id}&subscriptionType=basic&period=month`,
    );

    expect(response).toMatchObject({
      status: 500,
      data: {
        message: 'Problem creating customer.',
      },
    });
  });
});
