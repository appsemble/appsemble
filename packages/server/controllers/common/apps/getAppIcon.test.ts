import { readFixture } from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { App, Organization, OrganizationMember, type User } from '../../../models/index.js';
import { setArgv } from '../../../utils/argv.js';
import { createServer } from '../../../utils/createServer.js';
import { createTestUser } from '../../../utils/test/authorization.js';

let organization: Organization;
let user: User;

const argv = { host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' };

describe('getAppIcon', () => {
  beforeAll(async () => {
    vi.useFakeTimers();
    setArgv(argv);
    const server = await createServer();
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
    });
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('should serve the regular icon if requested', async () => {
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      icon: await readFixture('nodejs-logo.png'),
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    const response = await request.get(`/api/apps/${app.id}/icon`, {
      responseType: 'arraybuffer',
    });
    expect(response).toMatchInlineSnapshot(
      { data: expect.any(Buffer) },
      `
      HTTP/1.1 200 OK
      Content-Type: image/png

      Any<Buffer>
    `,
    );
    expect(response.data).toMatchImageSnapshot();
  });

  it('should generate a maskable icon from a horizontal app icon', async () => {
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      icon: await readFixture('nodejs-logo.png'),
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    const response = await request.get(`/api/apps/${app.id}/icon`, {
      params: { maskable: 'true' },
      responseType: 'arraybuffer',
    });
    expect(response).toMatchInlineSnapshot(
      { data: expect.any(Buffer) },
      `
      HTTP/1.1 200 OK
      Content-Type: image/png

      Any<Buffer>
    `,
    );
    expect(response.data).toMatchImageSnapshot();
  });

  it('should generate a maskable icon from a vertical app icon', async () => {
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      icon: await readFixture('10x50.png'),
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    const response = await request.get(`/api/apps/${app.id}/icon`, {
      params: { maskable: 'true' },
      responseType: 'arraybuffer',
    });
    expect(response).toMatchInlineSnapshot(
      { data: expect.any(Buffer) },
      `
      HTTP/1.1 200 OK
      Content-Type: image/png

      Any<Buffer>
    `,
    );
    expect(response.data).toMatchImageSnapshot();
  });

  it('should use the icon background color if one is specified', async () => {
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      icon: await readFixture('10x50.png'),
      iconBackground: '#00ffff',
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    const response = await request.get(`/api/apps/${app.id}/icon`, {
      params: { maskable: 'true' },
      responseType: 'arraybuffer',
    });
    expect(response).toMatchInlineSnapshot(
      { data: expect.any(Buffer) },
      `
      HTTP/1.1 200 OK
      Content-Type: image/png

      Any<Buffer>
    `,
    );
    expect(response.data).toMatchImageSnapshot();
  });

  it('should crop and fill an maskable icon', async () => {
    const app = await App.create({
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      path: 'test-app',
      maskableIcon: await readFixture('nodejs-logo.png'),
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    const response = await request.get(`/api/apps/${app.id}/icon`, {
      params: { maskable: 'true' },
      responseType: 'arraybuffer',
    });
    expect(response).toMatchInlineSnapshot(
      { data: expect.any(Buffer) },
      `
      HTTP/1.1 200 OK
      Content-Type: image/png

      Any<Buffer>
    `,
    );
    expect(response.data).toMatchImageSnapshot();
  });
});
