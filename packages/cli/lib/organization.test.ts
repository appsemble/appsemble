import { createServer, createTestUser, models, setArgv, useTestDatabase } from '@appsemble/server';
import { type AxiosTestInstance, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { initAxios } from './initAxios.js';
import { createOrganization, updateOrganization } from './organization.js';
import { authorizeCLI } from './testUtils.js';

const argv = { host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' };
let user: models.User;
let testApp: AxiosTestInstance;

const { Organization, OrganizationMember } = models;

useTestDatabase(import.meta);

beforeAll(() => {
  vi.useFakeTimers();
  setArgv(argv);
});

beforeEach(async () => {
  vi.clearAllTimers();
  vi.setSystemTime(0);
  const server = await createServer();
  testApp = await setTestApp(server);
  initAxios({ remote: testApp.defaults.baseURL });
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
      icon: null,
      website: 'htpps://example.com',
    });
    const organization = await Organization.findOne();
    expect(organization).toMatchInlineSnapshot(`
      {
        "created": 1970-01-01T00:00:00.000Z,
        "deleted": null,
        "description": "test description",
        "email": "test@example.com",
        "icon": null,
        "id": "test",
        "name": "Test",
        "updated": 1970-01-01T00:00:00.000Z,
        "website": "htpps://example.com",
      }
    `);
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
        icon: null,
        website: 'htpps://example.com',
      }),
    ).rejects.toThrow('Request failed with status code 409');
    vi.useFakeTimers();
  });
});

describe('updateOrganization', () => {
  it('should update an existing organization', async () => {
    const organization = await Organization.create({
      id: 'test',
      name: 'Test',
    });
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: 'Owner',
    });
    await authorizeCLI('organizations:write', testApp);
    await updateOrganization({
      id: organization.id,
      name: 'Test changed',
      description: null,
      email: 'test@example.com',
      website: null,
      icon: null,
    });
    await organization.reload();
    expect(organization.dataValues).toMatchInlineSnapshot(`
      {
        "created": 1970-01-01T00:00:00.000Z,
        "deleted": null,
        "description": null,
        "email": "test@example.com",
        "icon": null,
        "id": "test",
        "name": "Test changed",
        "updated": 1970-01-01T00:00:00.000Z,
        "website": null,
      }
    `);
  });

  it('should throw if the organization does not exist', async () => {
    const organization = await Organization.create({
      id: 'test',
      name: 'Test',
    });
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: 'Owner',
    });
    await organization.destroy();
    await authorizeCLI('organizations:write', testApp);
    await expect(() =>
      updateOrganization({
        id: organization.id,
        name: 'Test changed',
        description: null,
        email: 'test@example.com',
        website: null,
        icon: null,
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
      role: 'Owner',
    });
    await expect(() =>
      updateOrganization({
        id: organization.id,
        name: 'Test changed',
        description: null,
        email: 'test@example.com',
        website: null,
        icon: null,
      }),
    ).rejects.toThrow('Request failed with status code 401');
  });
});
