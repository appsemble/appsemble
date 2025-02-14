import { createFormData, uploadS3File } from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { uuid4Pattern } from '@appsemble/utils';
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

let organization: Organization;
let user: User;
let app: App;

describe('deleteAppAssets', () => {
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
      role: PredefinedOrganizationRole.Owner,
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

  it('should delete existing assets', async () => {
    const assetA = await Asset.create({
      AppId: app.id,
      mime: 'application/octet-stream',
      filename: 'test.bin',
    });
    await uploadS3File(`app-${app.id}`, assetA.id, Buffer.from('buffer'));
    const assetB = await Asset.create({
      AppId: app.id,
      mime: 'application/octet-stream',
      filename: 'test.bin',
    });
    await uploadS3File(`app-${app.id}`, assetB.id, Buffer.from('buffer'));
    const assetC = await Asset.create({
      AppId: app.id,
      mime: 'application/octet-stream',
      filename: 'test.bin',
    });
    await uploadS3File(`app-${app.id}`, assetC.id, Buffer.from('buffer'));

    authorizeStudio();
    const assetsResponse = await request.get(`/api/apps/${app.id}/assets`);
    const response = await request.delete(`/api/apps/${app.id}/assets`, {
      data: [assetA.id, assetB.id],
    });
    const newAssetsResponse = await request.get(`/api/apps/${app.id}/assets`);

    expect(assetsResponse).toMatchInlineSnapshot(
      {
        data: [
          { id: expect.stringMatching(uuid4Pattern) },
          { id: expect.stringMatching(uuid4Pattern) },
          { id: expect.stringMatching(uuid4Pattern) },
        ],
      },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "filename": "test.bin",
          "id": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
          "mime": "application/octet-stream",
        },
        {
          "filename": "test.bin",
          "id": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
          "mime": "application/octet-stream",
        },
        {
          "filename": "test.bin",
          "id": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
          "mime": "application/octet-stream",
        },
      ]
    `,
    );
    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(newAssetsResponse).toMatchInlineSnapshot(
      { data: [{ id: expect.stringMatching(uuid4Pattern) }] },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "filename": "test.bin",
          "id": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
          "mime": "application/octet-stream",
        },
      ]
    `,
    );
  });

  it('should soft delete assets', async () => {
    const assetA = await Asset.create({
      AppId: app.id,
      mime: 'application/octet-stream',
      filename: 'test.bin',
    });
    await uploadS3File(`app-${app.id}`, assetA.id, Buffer.from('buffer'));
    const assetB = await Asset.create({
      AppId: app.id,
      mime: 'application/octet-stream',
      filename: 'test.bin',
    });
    await uploadS3File(`app-${app.id}`, assetB.id, Buffer.from('buffer'));
    const assetC = await Asset.create({
      AppId: app.id,
      mime: 'application/octet-stream',
      filename: 'test.bin',
    });
    await uploadS3File(`app-${app.id}`, assetC.id, Buffer.from('buffer'));

    const assetIds = [assetA.id, assetB.id];
    authorizeStudio();
    const response = await request.delete(`/api/apps/${app.id}/assets`, {
      data: assetIds,
    });
    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    const assets = await Asset.findAll({
      where: {
        id: assetIds,
      },
      paranoid: false,
    });
    expect(assets).toMatchObject([
      {
        AppId: app.id,
        mime: 'application/octet-stream',
        filename: 'test.bin',
        deleted: expect.any(Date),
      },
      {
        AppId: app.id,
        mime: 'application/octet-stream',
        filename: 'test.bin',
        deleted: expect.any(Date),
      },
    ]);
  });

  it('should delete items from cache when an asset is deleted', async () => {
    const assetA = await Asset.create({
      AppId: app.id,
      mime: 'application/octet-stream',
      filename: 'test.bin',
    });
    await uploadS3File(`app-${app.id}`, assetA.id, Buffer.from('buffer'));
    const assetB = await Asset.create({
      AppId: app.id,
      mime: 'application/octet-stream',
      filename: 'test.bin',
    });
    await uploadS3File(`app-${app.id}`, assetB.id, Buffer.from('buffer'));
    const assetC = await Asset.create({
      AppId: app.id,
      mime: 'application/octet-stream',
      filename: 'test.bin',
    });
    await uploadS3File(`app-${app.id}`, assetC.id, Buffer.from('buffer'));
    const assetAId = assetA.id;
    const assetBId = assetB.id;

    authorizeStudio();
    await request.get(`/api/apps/${app.id}/assets/${assetAId}`);
    await request.get(`/api/apps/${app.id}/assets/${assetBId}`);

    const { status } = await request.delete(`/api/apps/${app.id}/assets`, {
      data: [assetAId, assetBId],
    });
    expect(status).toBe(204);
  });

  it('should not delete existing assets from different apps', async () => {
    const appB = await App.create({
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
      path: 'test-app-B',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    const asset = await Asset.create({
      AppId: appB.id,
      mime: 'application/octet-stream',
      filename: 'test.bin',
      data: Buffer.from('buffer'),
    });
    const assetB = await Asset.create({
      AppId: appB.id,
      mime: 'application/octet-stream',
      filename: 'test.bin',
      data: Buffer.from('buffer'),
    });
    await Asset.create({
      AppId: appB.id,
      mime: 'application/octet-stream',
      filename: 'test.bin',
      data: Buffer.from('buffer'),
    });

    authorizeStudio();
    const response = await request.delete(`/api/apps/${app.id}/assets`, {
      data: [asset.id, assetB.id],
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "No assets found",
        "statusCode": 404,
      }
    `);
  });

  it('should ignore non-existent IDs when deleting multiple existing assets', async () => {
    const assetA = await Asset.create({
      AppId: app.id,
      mime: 'application/octet-stream',
      filename: 'test.bin',
    });
    await uploadS3File(`app-${app.id}`, assetA.id, Buffer.from('buffer'));
    const assetB = await Asset.create({
      AppId: app.id,
      mime: 'application/octet-stream',
      filename: 'test.bin',
    });
    await uploadS3File(`app-${app.id}`, assetB.id, Buffer.from('buffer'));
    const assetC = await Asset.create({
      AppId: app.id,
      mime: 'application/octet-stream',
      filename: 'test.bin',
    });
    await uploadS3File(`app-${app.id}`, assetC.id, Buffer.from('buffer'));

    authorizeStudio();
    const assetsResponse = await request.get(`/api/apps/${app.id}/assets`);
    const response = await request.delete(`/api/apps/${app.id}/assets`, {
      data: [assetA.id, assetB.id],
    });
    const newAssetsResponse = await request.get(`/api/apps/${app.id}/assets`);

    expect(assetsResponse).toMatchInlineSnapshot(
      {
        data: [
          { id: expect.stringMatching(uuid4Pattern) },
          { id: expect.stringMatching(uuid4Pattern) },
          { id: expect.stringMatching(uuid4Pattern) },
        ],
      },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "filename": "test.bin",
          "id": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
          "mime": "application/octet-stream",
        },
        {
          "filename": "test.bin",
          "id": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
          "mime": "application/octet-stream",
        },
        {
          "filename": "test.bin",
          "id": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
          "mime": "application/octet-stream",
        },
      ]
    `,
    );
    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(newAssetsResponse).toMatchInlineSnapshot(
      { data: [{ id: expect.stringMatching(uuid4Pattern) }] },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        {
          "filename": "test.bin",
          "id": StringMatching /\\^\\[\\\\d\\[a-f\\]\\{8\\}-\\[\\\\da-f\\]\\{4\\}-4\\[\\\\da-f\\]\\{3\\}-\\[\\\\da-f\\]\\{4\\}-\\[\\\\d\\[a-f\\]\\{12\\}\\$/,
          "mime": "application/octet-stream",
        },
      ]
    `,
    );
  });

  it('should delete seed assets from all apps', async () => {
    authorizeStudio();
    await request.post<Asset>(
      `/api/apps/${app.id}/assets`,
      createFormData({ file: Buffer.alloc(0) }),
      { params: { seed: true } },
    );
    const response = await request.delete(`/api/apps/${app.id}/assets`, {
      data: [],
      params: { seed: true },
    });
    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');

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
    await request.post<Asset>(
      `/api/apps/${app.id}/assets`,
      createFormData({ file: Buffer.alloc(0) }),
      { params: { seed: true } },
    );

    const response = await request.delete(`/api/apps/${app.id}/assets`, {
      data: [],
      params: { seed: true },
    });
    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');

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
