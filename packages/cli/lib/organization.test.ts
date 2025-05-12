import { createFixtureStream, readFixture } from '@appsemble/node-utils';
import { createServer, createTestUser, models, setArgv } from '@appsemble/server';
import { PaymentProvider, PredefinedOrganizationRole } from '@appsemble/types';
import { type AxiosTestInstance, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { initAxios } from './initAxios.js';
import { createOrganization, updateOrganization, upsertOrganization } from './organization.js';
import { authorizeCLI } from './testUtils.js';

const argv = { host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' };
let user: models.User;
let testApp: AxiosTestInstance;

const { Organization, OrganizationMember } = models;

describe('organization', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    setArgv(argv);
  });

  beforeEach(async () => {
    vi.clearAllTimers();
    vi.setSystemTime(0);
    const server = await createServer();
    testApp = await setTestApp(server);
    initAxios({ remote: testApp.defaults.baseURL! });
    user = await createTestUser();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  describe('createOrganization', () => {
    it('should create a new organization', async () => {
      await authorizeCLI('organizations:write', testApp);
      await createOrganization({
        description: 'test description',
        id: 'test',
        name: 'Test',
        email: 'test@example.com',
        icon: createFixtureStream('apps/tux.png'),
        website: 'https://example.com',
        preferredPaymentProvider: PaymentProvider.Stripe,
        vatIdNumber: 'number123123',
        streetName: 'street',
        houseNumber: '123',
        city: 'city',
        zipCode: 'zip',
        countryCode: 'NL',
        invoiceReference: 'employee',
      });
      const organization = await Organization.findOne();
      expect(organization).toMatchObject({
        description: 'test description',
        email: 'test@example.com',
        icon: await readFixture('apps/tux.png'),
        id: 'test',
        name: 'Test',
        website: 'https://example.com',
        preferredPaymentProvider: 'stripe',
        vatIdNumber: 'number123123',
        streetName: 'street',
        houseNumber: '123',
        city: 'city',
        zipCode: 'zip',
        countryCode: 'NL',
        invoiceReference: 'employee',
        stripeCustomerId: null,
        updated: expect.any(Date),
      });
    });

    it('should not create a new organization with duplicate id', async () => {
      const organization = await Organization.create({
        id: 'test',
        name: 'Test',
      });
      vi.useRealTimers();
      await authorizeCLI('organizations:write', testApp);
      await expect(() =>
        createOrganization({
          description: 'test description',
          id: organization.id,
          name: 'Test',
          email: 'test@example.com',
          // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
          icon: null,
          website: 'https://example.com',
          preferredPaymentProvider: PaymentProvider.Stripe,
          vatIdNumber: 'number123123',
          streetName: 'street',
          houseNumber: '123',
          city: 'city',
          zipCode: 'zip',
          countryCode: 'NL',
          invoiceReference: 'employee',
        }),
      ).rejects.toThrow('Request failed with status code 409');
      vi.useFakeTimers();
    });
  });

  describe('updateOrganization', () => {
    it('should update an existing organization', async () => {
      vi.useRealTimers();
      const organization = await Organization.create({
        id: 'test',
        name: 'Test',
      });
      await OrganizationMember.create({
        OrganizationId: organization.id,
        UserId: user.id,
        role: PredefinedOrganizationRole.Owner,
      });
      await authorizeCLI('organizations:write', testApp);
      await updateOrganization({
        id: organization.id,
        name: 'Test changed',
        description: 'Description Changed',
        email: 'test@example.com',
        // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
        website: null,
        icon: createFixtureStream('apps/tux.png'),
        preferredPaymentProvider: PaymentProvider.Stripe,
        vatIdNumber: 'number123',
        streetName: 'street2',
        houseNumber: '1234',
        city: 'city2',
        zipCode: 'zip2',
        countryCode: 'BE',
        invoiceReference: 'employee2',
      });
      await organization.reload();
      expect(organization.dataValues).toMatchInlineSnapshot(
        {
          icon: expect.any(Buffer),
          created: expect.any(Date),
          updated: expect.any(Date),
        },
        `
      {
        "city": "city2",
        "countryCode": "BE",
        "created": Any<Date>,
        "deleted": null,
        "description": "Description Changed",
        "email": "test@example.com",
        "houseNumber": "1234",
        "icon": Any<Buffer>,
        "id": "test",
        "invoiceReference": "employee2",
        "name": "Test changed",
        "preferredPaymentProvider": "stripe",
        "streetName": "street2",
        "stripeCustomerId": null,
        "updated": Any<Date>,
        "vatIdNumber": "number123",
        "website": null,
        "zipCode": "zip2",
      }
    `,
      );
    });

    it('should throw if the organization does not exist', async () => {
      const organization = await Organization.create({
        id: 'test',
        name: 'Test',
      });
      await OrganizationMember.create({
        OrganizationId: organization.id,
        UserId: user.id,
        role: PredefinedOrganizationRole.Owner,
      });
      await organization.destroy();
      await authorizeCLI('organizations:write', testApp);
      await expect(() =>
        updateOrganization({
          id: organization.id,
          name: 'Test changed',
          // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
          description: null,
          email: 'test@example.com',
          // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
          website: null,
          // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
          icon: null,
          vatIdNumber: null,
          streetName: null,
          houseNumber: null,
          city: null,
          zipCode: null,
          countryCode: null,
          invoiceReference: null,
        }),
      ).rejects.toThrow('Request failed with status code 404');
    });

    it('should throw if the user is not authorized', async () => {
      const organization = await Organization.create({
        id: 'test',
        name: 'Test',
      });
      await OrganizationMember.create({
        OrganizationId: organization.id,
        UserId: user.id,
        role: PredefinedOrganizationRole.Owner,
      });
      await expect(() =>
        updateOrganization({
          id: organization.id,
          name: 'Test changed',
          // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
          description: null,
          email: 'test@example.com',
          // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
          website: null,
          // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
          icon: null,
          vatIdNumber: null,
          streetName: null,
          houseNumber: null,
          city: null,
          zipCode: null,
          countryCode: null,
          invoiceReference: null,
        }),
      ).rejects.toThrow('Request failed with status code 401');
    });
  });

  describe('upsertOrganization', () => {
    it('should create a new organization if doesn’t exist already', async () => {
      await authorizeCLI('organizations:write', testApp);
      await upsertOrganization({
        description: 'test description',
        id: 'test',
        name: 'Test',
        email: 'test@example.com',
        // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
        icon: null,
        website: 'https://example.com',
        vatIdNumber: null,
        streetName: 'street',
        houseNumber: '123',
        city: 'city',
        zipCode: 'zip',
        countryCode: 'NL',
        invoiceReference: null,
      });
      const organization = await Organization.findOne();
      expect(organization).toMatchObject({
        id: 'test',
        description: 'test description',
        name: 'Test',
        email: 'test@example.com',
        icon: null,
        website: 'https://example.com',
        preferredPaymentProvider: 'stripe',
        streetName: 'street',
        houseNumber: '123',
        city: 'city',
        zipCode: 'zip',
        countryCode: 'NL',
      });
    });

    it('should update an existing organization', async () => {
      const organization = await Organization.create({
        id: 'test',
        name: 'Test',
      });
      await OrganizationMember.create({
        OrganizationId: organization.id,
        UserId: user.id,
        role: PredefinedOrganizationRole.Owner,
      });
      await authorizeCLI('organizations:write', testApp);
      await upsertOrganization({
        id: organization.id,
        name: 'Test changed',
        // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
        description: null,
        email: 'test@example.com',
        // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
        website: null,
        // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
        icon: null,
        vatIdNumber: null,
        streetName: null,
        houseNumber: null,
        city: null,
        zipCode: null,
        countryCode: null,
        invoiceReference: null,
      });
      expect(organization).toMatchObject({
        id: 'test',
        name: 'Test',
        preferredPaymentProvider: 'stripe',
      });
      await organization.reload();
      expect(organization).toMatchObject({
        id: organization.id,
        name: 'Test changed',
        description: null,
        email: 'test@example.com',
        website: null,
        icon: null,
      });
    });

    it('should throw if there is an error', async () => {
      const organization = await Organization.create({
        id: 'test',
        name: 'Test',
      });
      await authorizeCLI('organizations:write', testApp);
      // Fails because the organization member does not exist.
      await expect(() =>
        upsertOrganization({
          id: organization.id,
          name: 'Test changed',
          // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
          description: null,
          email: 'test@example.com',
          website: 'https://www.example.com',
          // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
          icon: null,
          vatIdNumber: null,
          streetName: null,
          houseNumber: null,
          city: null,
          zipCode: null,
          countryCode: null,
          invoiceReference: null,
        }),
      ).rejects.toThrow('Request failed with status code 403');
      expect(organization).toMatchObject({
        id: 'test',
        name: 'Test',
      });
    });
  });
});
