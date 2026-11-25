import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, describe, expect, it } from 'vitest';

import { App, Organization } from '../../../../../models/index.js';
import { setArgv } from '../../../../../utils/argv.js';
import { createServer } from '../../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../../utils/test/authorization.js';

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
});
