import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, describe, expect, it } from 'vitest';

import { App, Organization, OrganizationMember } from '../../../../../models/index.js';
import { setArgv } from '../../../../../utils/argv.js';
import { createServer } from '../../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../../utils/test/authorization.js';

async function createOwnedApp(): Promise<App> {
  const user = await createTestUser();
  const organization = await Organization.create({ id: 'testorganization' });
  await OrganizationMember.create({
    OrganizationId: organization.id,
    UserId: user.id,
    role: PredefinedOrganizationRole.Owner,
  });
  return App.create({
    OrganizationId: organization.id,
    vapidPublicKey: '',
    vapidPrivateKey: '',
    definition: {},
    sslCertificate: 'original certificate',
    sslKey: 'original key',
  });
}

describe('updateAppSslSecret', () => {
  beforeAll(async () => {
    setArgv({ host: 'http://localhost', secret: 'test' });
    const server = await createServer();
    await setTestApp(server);
  });

  it('should not update the SSL secret for users outside the organization', async () => {
    await createTestUser();
    const organization = await Organization.create({ id: 'testorganization' });
    const app = await App.create({
      OrganizationId: organization.id,
      vapidPublicKey: '',
      vapidPrivateKey: '',
      definition: {},
      sslCertificate: 'original certificate',
      sslKey: 'original key',
    });
    authorizeStudio();

    const response = await request.put(`/api/apps/${app.id}/secrets/ssl`, {
      certificate: 'new certificate',
      key: 'new key',
    });

    expect(response.status).toBe(403);
    await app.reload();
    expect({ certificate: app.sslCertificate, key: app.sslKey }).toStrictEqual({
      certificate: 'original certificate',
      key: 'original key',
    });
  });

  it('should keep the private key when an update leaves it out', async () => {
    const app = await createOwnedApp();
    authorizeStudio();

    const response = await request.put(`/api/apps/${app.id}/secrets/ssl`, {
      certificate: 'new certificate',
    });

    expect(response.data).toStrictEqual({ certificate: 'new certificate', incomplete: false });
    await app.reload();
    expect({ certificate: app.sslCertificate, key: app.sslKey }).toStrictEqual({
      certificate: 'new certificate',
      key: 'original key',
    });
  });

  it('should replace the private key without returning it', async () => {
    const app = await createOwnedApp();
    authorizeStudio();

    const response = await request.put(`/api/apps/${app.id}/secrets/ssl`, {
      certificate: 'new certificate',
      key: 'new key',
    });

    expect(response.data).toStrictEqual({ certificate: 'new certificate', incomplete: false });
    await app.reload();
    expect({ certificate: app.sslCertificate, key: app.sslKey }).toStrictEqual({
      certificate: 'new certificate',
      key: 'new key',
    });
  });

  it('should clear the private key when an update sends an empty one', async () => {
    const app = await createOwnedApp();
    authorizeStudio();

    const response = await request.put(`/api/apps/${app.id}/secrets/ssl`, {
      certificate: '',
      key: '',
    });

    expect(response.data).toStrictEqual({ certificate: null, incomplete: true });
    await app.reload();
    expect({ certificate: app.sslCertificate, key: app.sslKey }).toStrictEqual({
      certificate: null,
      key: null,
    });
  });
});
