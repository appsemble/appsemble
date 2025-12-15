import { getS3FileBuffer, readFixture, resolveFixture } from '@appsemble/node-utils';
import { createServer, createTestUser, models, setArgv } from '@appsemble/server';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { type AxiosTestInstance, setTestApp } from 'axios-test-instance';
import sharp from 'sharp';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { publishAsset } from './asset.js';
import { initAxios } from './initAxios.js';
import { authorizeCLI } from './testUtils.js';

const argv = { host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' };
let user: models.User;
let organization: models.Organization;
let testApp: AxiosTestInstance;

const { App, Organization, OrganizationMember, getAppDB } = models;

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
    initAxios({ remote: testApp.defaults.baseURL! });
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
      vi.useRealTimers();
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
        remote: testApp.defaults.baseURL!,
        seed: false,
      });
      const { Asset } = await getAppDB(app.id);
      const asset = (await Asset.findOne())!;
      expect(asset).toStrictEqual(
        expect.objectContaining({
          filename: 'tux.avif',
          name: 'test',
          mime: 'image/avif',
        }),
      );
      expect(await getS3FileBuffer(`app-${app.id}`, asset.id)).toStrictEqual(
        await sharp(await readFixture('apps/tux.png'))
          .toFormat('avif')
          .toBuffer(),
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
          remote: testApp.defaults.baseURL!,
          seed: false,
        }),
      ).rejects.toThrowError('Request failed with status code 404');
    });
  });
});
