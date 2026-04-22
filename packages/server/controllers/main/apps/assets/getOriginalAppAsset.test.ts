import { uploadS3File } from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import sharp from 'sharp';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  App,
  getAppDB,
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

describe('getOriginalAppAsset', () => {
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

  it('should allow studio users to download the original image binary.', async () => {
    const { Asset } = await getAppDB(app.id);
    const asset = await Asset.create({
      mime: 'image/png',
      filename: 'logo.png',
    });
    const image = await sharp({
      create: {
        width: 120,
        height: 80,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .png()
      .toBuffer();

    await uploadS3File(`app-${app.id}`, asset.id, image);

    authorizeStudio(user);
    const response = await request.get(`/api/apps/${app.id}/assets/${asset.id}/download`, {
      responseType: 'arraybuffer',
    });

    expect(response).toMatchObject({
      status: 200,
      headers: expect.objectContaining({
        'content-type': 'image/png',
        'content-disposition': 'inline; filename="logo.png"',
        'cache-control': 'max-age=31536000,immutable',
      }),
    });
    expect(Buffer.from(response.data)).toStrictEqual(image);
  });

  it('should reject original downloads without studio asset access.', async () => {
    const { Asset } = await getAppDB(app.id);
    const asset = await Asset.create({
      mime: 'image/png',
      filename: 'logo.png',
    });
    const image = await sharp({
      create: {
        width: 120,
        height: 80,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .png()
      .toBuffer();

    await uploadS3File(`app-${app.id}`, asset.id, image);

    const response = await request.get(`/api/apps/${app.id}/assets/${asset.id}/download`, {
      validateStatus: () => true,
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 401 Unauthorized
      Content-Type: text/plain; charset=utf-8

      Unauthorized
    `);
  });
});
