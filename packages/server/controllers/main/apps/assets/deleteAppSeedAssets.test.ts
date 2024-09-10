import { createFormData } from '@appsemble/node-utils';
import { type Asset as AssetType } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  App,
  Asset,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../utils/test/authorization.js';
import { useTestDatabase } from '../../../../utils/test/testSchema.js';

let organization: Organization;
let user: User;
let app: App;

useTestDatabase(import.meta);

beforeAll(async () => {
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer();
  await setTestApp(server);
});

beforeEach(async () => {
  user = await createTestUser();
  organization = await Organization.create({
    id: 'testorganization',
    name: 'Test Organization',
  });
  await OrganizationMember.create({
    OrganizationId: organization.id,
    UserId: user.id,
    role: 'Owner',
  });

  app = await App.create({
    definition: {
      name: 'Test App',
      defaultPage: 'Test Page',
      security: {
        default: {
          role: 'Reader',
          policy: 'everyone',
        },
        roles: {
          Reader: {},
        },
      },
    },
    path: 'test-app',
    vapidPublicKey: 'a',
    vapidPrivateKey: 'b',
    OrganizationId: organization.id,
  });
});

describe('deleteAppSeedAssets', () => {
  it('should delete seed assets from all apps', async () => {
    authorizeStudio();
    await request.post<AssetType>(
      `/api/main/apps/${app.id}/assets`,
      createFormData({ file: Buffer.alloc(0) }),
    );

    await request.delete(`/api/main/apps/${app.id}/assets`);

    const seedAsset = await Asset.findOne({
      where: {
        AppId: app.id,
        seed: true,
        ephemeral: false,
      },
    });

    expect(seedAsset).toBeNull();
  });

  it('should delete seed assets and ephemeral assets from demo apps', async () => {
    authorizeStudio();
    await app.update({ demoMode: true });
    await request.post<AssetType>(
      `/api/main/apps/${app.id}/seed-assets`,
      createFormData({ file: Buffer.alloc(0) }),
    );

    await request.delete(`/api/main/apps/${app.id}/assets`);

    const seedAsset = await Asset.findOne({
      where: {
        AppId: app.id,
        seed: true,
        ephemeral: false,
      },
    });
    expect(seedAsset).toBeNull();

    const ephemeralAsset = await Asset.findOne({
      where: {
        AppId: app.id,
        seed: false,
        ephemeral: true,
      },
    });
    expect(ephemeralAsset).toBeNull();
  });
});
