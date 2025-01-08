import { resolveFixture } from '@appsemble/node-utils';
import { createServer, createTestUser, models, setArgv } from '@appsemble/server';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { type AxiosTestInstance, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { publishAsset } from './asset.js';
import { initAxios } from './initAxios.js';
import { authorizeCLI } from './testUtils.js';

const argv = { host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' };
let user: models.User;
let organization: models.Organization;
let testApp: AxiosTestInstance;

const { App, Asset, Organization, OrganizationMember } = models;

describe('asset', () => {
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
    organization = await Organization.create({
      id: 'testorganization',
      name: 'Test Organization',
    });
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });

    await Organization.create({ id: 'appsemble', name: 'Appsemble' });
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  describe('publishAsset', () => {
    it('should publish an asset from a file', async () => {
      const app = await App.create({
        path: 'test-app',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        visibility: 'public',
        OrganizationId: organization.id,
      });
      await authorizeCLI('assets:write', testApp);
      await publishAsset({
        appId: app.id,
        clonable: false,
        name: 'test',
        path: resolveFixture('apps/tux.png'),
        remote: testApp.defaults.baseURL,
        seed: false,
      });
      const asset = await Asset.findOne();
      expect(asset.dataValues).toMatchInlineSnapshot(
        {
          id: expect.any(String),
          data: expect.any(Buffer),
        },
        `
        {
          "AppId": 1,
          "AppMemberId": null,
          "GroupId": null,
          "OriginalId": null,
          "ResourceId": null,
          "clonable": false,
          "created": 1970-01-01T00:00:00.000Z,
          "data": Any<Buffer>,
          "deleted": null,
          "ephemeral": false,
          "filename": "tux.png",
          "id": Any<String>,
          "mime": "image/png",
          "name": "test",
          "seed": false,
          "updated": 1970-01-01T00:00:00.000Z,
        }
      `,
      );
    });

    it('should throw an error if the app does not exist', async () => {
      const app = await App.create({
        path: 'test-app',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        visibility: 'public',
        OrganizationId: organization.id,
      });
      await app.destroy();
      await authorizeCLI('assets:write', testApp);
      await expect(() =>
        publishAsset({
          appId: app.id,
          clonable: false,
          name: 'test',
          path: resolveFixture('apps/tux.png'),
          remote: testApp.defaults.baseURL,
          seed: false,
        }),
      ).rejects.toThrow('Request failed with status code 404');
    });
  });
});
