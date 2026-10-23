import { createFormData, readFixture } from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { request, setTestApp } from 'axios-test-instance';
import type Koa from 'koa';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  AppCollection,
  EmailAuthorization,
  Organization,
  OrganizationMember,
  type User,
} from '../../../models/index.js';
import { setArgv } from '../../../utils/argv.js';
import { createServer } from '../../../utils/createServer.js';
import { configureDNS } from '../../../utils/dns/index.js';
import { authorizeStudio, createTestUser } from '../../../utils/test/authorization.js';

vi.mock('node:fs/promises', async (importOriginal) => {
  const fsPromises = await importOriginal<typeof import('node:fs/promises')>();
  const readFile = ((path, options) =>
    String(path).startsWith('/var/run/secrets/kubernetes.io/serviceaccount/')
      ? Promise.resolve('test')
      : fsPromises.readFile(path, options)) as typeof fsPromises.readFile;
  return { ...fsPromises, default: { ...fsPromises, readFile }, readFile };
});

let organization: Organization;
let server: Koa;
let user: User;

describe('createOrganization', () => {
  beforeAll(async () => {
    vi.useFakeTimers();
    setArgv({ host: 'http://localhost', secret: 'test' });
    server = await createServer();
    await setTestApp(server);
  });

  beforeEach(async () => {
    // https://github.com/vitest-dev/vitest/issues/1154#issuecomment-1138717832
    vi.clearAllTimers();
    vi.setSystemTime(0);
    user = await createTestUser();
    organization = await Organization.create({
      id: 'testorganization',
      name: 'Test Organization',
      icon: await readFixture('nodejs-logo.png'),
    });
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });
  });

  it('should create a new organization', async () => {
    authorizeStudio();
    const response = await request.post(
      '/api/organizations',
      createFormData({ id: 'foo', name: 'Foooo' }),
    );

    expect(response).toMatchObject({
      status: 201,
      data: {
        id: 'foo',
        name: 'Foooo',
        locale: 'en',
        members: [
          {
            id: expect.any(String),
            name: 'Test User',
            primaryEmail: 'test@example.com',
            role: PredefinedOrganizationRole.Owner,
          },
        ],
        iconUrl: null,
        invites: [],
      },
    });
  });

  it('should create a new organization with an icon', async () => {
    authorizeStudio();
    const formData = createFormData({ id: 'foo', name: 'Foooo' });
    const buffer = await readFixture('testpattern.png');
    formData.append('icon', buffer, { filename: 'icon.png' });
    const response = await request.post('/api/organizations', formData);

    expect(response).toMatchObject({
      status: 201,
      data: {
        id: 'foo',
        name: 'Foooo',
        members: [
          {
            id: expect.any(String),
            name: 'Test User',
            primaryEmail: 'test@example.com',
            role: PredefinedOrganizationRole.Owner,
          },
        ],
        iconUrl: '/api/organizations/foo/icon?updated=1970-01-01T00:00:00.000Z',
        invites: [],
      },
    });
  });

  it('should create a new organization with payment information', async () => {
    authorizeStudio();
    const formData = createFormData({
      id: 'foo',
      name: 'Foooo',
      vatIdNumber: 'number123',
      streetName: 'street',
      houseNumber: '1',
      city: 'Eindhoven',
      zipCode: '1234AD',
      countryCode: 'NL',
      invoiceReference: 'employee name',
    });
    const response = await request.post('/api/organizations', formData);

    expect(response).toMatchObject({
      status: 201,
      data: {
        id: 'foo',
        name: 'Foooo',
        members: [
          {
            id: expect.any(String),
            name: 'Test User',
            primaryEmail: 'test@example.com',
            role: PredefinedOrganizationRole.Owner,
          },
        ],
        invites: [],
        vatIdNumber: 'number123',
        streetName: 'street',
        houseNumber: '1',
        city: 'Eindhoven',
        zipCode: '1234AD',
        countryCode: 'NL',
        invoiceReference: 'employee name',
      },
    });
  });

  it('should not create a new organization if user is unverified', async () => {
    await EmailAuthorization.update({ verified: false }, { where: { UserId: user.id } });

    authorizeStudio();
    const response = await request.post(
      '/api/organizations',
      createFormData({ id: 'foo', name: 'Foooo' }),
    );

    expect(response).toMatchObject({
      status: 403,
      data: {
        error: 'Forbidden',
        message: 'Email not verified.',
        statusCode: 403,
      },
    });
  });

  it('should not create an organization with the same identifier', async () => {
    // This prevents the test from hanging and timing out
    vi.useRealTimers();

    authorizeStudio();
    await request.post('/api/organizations', createFormData({ id: 'foo', name: 'Foooo' }));

    const response = await request.post(
      '/api/organizations',
      createFormData({ id: 'foo', name: 'Foooo' }),
    );

    expect(response).toMatchObject({
      status: 409,
      data: { message: 'Another organization with the id “foo” already exists' },
    });
  });

  it.each([
    'www',
    'api',
    'email',
    'mail',
    'app',
    'site',
    'smtp',
    'imap',
    'autoconfig',
    'autodiscover',
    'mta-sts',
    'grafana',
    'mailpit',
    'minio',
  ])('should not allow the organization id ‘%s’', async (blockedName) => {
    authorizeStudio();
    const response = await request.post('/api/organizations', createFormData({ id: blockedName }));
    expect(response).toMatchObject({
      status: 400,
      data: { message: 'This organization id is not allowed.' },
    });
  });

  describe('with DNS records', () => {
    const mock = new MockAdapter(axios as ConstructorParameters<typeof MockAdapter>[0]);

    beforeEach(async () => {
      setArgv({
        host: 'http://localhost',
        secret: 'test',
        appDomainStrategy: 'kubernetes-ingress',
        dnsProvider: 'desec',
        dnsTargets: '203.0.113.10',
        dnsToken: 'test.token',
        dnsZone: 'localhost',
      });
      await configureDNS();
    });

    afterEach(() => {
      mock.reset();
      App.removeHook('afterSave', 'dns');
      App.removeHook('afterDestroy', 'dns');
      Organization.removeHook('afterCreate', 'dns');
      Organization.removeHook('afterDestroy', 'dns');
      AppCollection.removeHook('afterSave', 'dns');
      AppCollection.removeHook('afterDestroy', 'dns');
      setArgv({ host: 'http://localhost', secret: 'test' });
    });

    it('should let the user retry when the DNS records cannot be written', async () => {
      mock
        .onPatch('https://desec.io/api/v1/domains/localhost/rrsets/')
        .replyOnce(429, {}, { 'retry-after': '3600' })
        .onPatch('https://desec.io/api/v1/domains/localhost/rrsets/')
        .reply(200, [])
        .onPost(/\/ingresses$/)
        .reply(({ data }) => [201, data]);
      authorizeStudio();

      await request.post('/api/organizations', createFormData({ id: 'foo', name: 'Foooo' }));
      const retried = await request.post(
        '/api/organizations',
        createFormData({ id: 'foo', name: 'Foooo' }),
      );

      expect(retried).toMatchObject({
        status: 201,
        data: { id: 'foo', members: [{ role: PredefinedOrganizationRole.Owner }] },
      });
    });
  });
});
