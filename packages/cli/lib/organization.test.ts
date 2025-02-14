import { createFixtureStream, readFixture } from '@appsemble/node-utils';
import { createServer, createTestUser, models, setArgv } from '@appsemble/server';
import { PredefinedOrganizationRole } from '@appsemble/types';
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
        icon: createFixtureStream('apps/tux.png'),
        website: 'https://example.com',
      });
      const organization = await Organization.findOne();
      expect(organization).toMatchObject({
        description: 'test description',
        email: 'test@example.com',
        icon: await readFixture('apps/tux.png'),
        id: 'test',
        name: 'Test',
        website: 'https://example.com',
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
          icon: null,
          website: 'https://example.com',
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
        website: null,
        icon: createFixtureStream('apps/tux.png'),
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
        "created": Any<Date>,
        "deleted": null,
        "description": "Description Changed",
        "email": "test@example.com",
        "icon": Any<Buffer>,
        "id": "test",
        "name": "Test changed",
        "updated": Any<Date>,
        "website": null,
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
        role: PredefinedOrganizationRole.Owner,
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

  describe('upsertOrganization', () => {
    it('should create a new organization if doesn’t exist already', async () => {
      await authorizeCLI('organizations:write', testApp);
      await upsertOrganization({
        description: 'test description',
        id: 'test',
        name: 'Test',
        email: 'test@example.com',
        icon: null,
        website: 'https://example.com',
      });
      const organization = await Organization.findOne();
      expect(organization).toMatchObject({
        id: 'test',
        description: 'test description',
        name: 'Test',
        email: 'test@example.com',
        icon: null,
        website: 'https://example.com',
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
        description: null,
        email: 'test@example.com',
        website: null,
        icon: null,
      });
      expect(organization).toMatchObject({
        id: 'test',
        name: 'Test',
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
          description: null,
          email: 'test@example.com',
          website: 'https://www.example.com',
          icon: null,
        }),
      ).rejects.toThrow('Request failed with status code 403');
      expect(organization).toMatchObject({
        id: 'test',
        name: 'Test',
      });
    });
  });
});
