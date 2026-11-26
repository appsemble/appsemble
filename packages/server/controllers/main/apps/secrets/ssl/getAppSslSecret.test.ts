import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, describe, expect, it } from 'vitest';

import { App, Organization, OrganizationMember } from '../../../../../models/index.js';
import { setArgv } from '../../../../../utils/argv.js';
import { createServer } from '../../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../../utils/test/authorization.js';

describe('getAppSslSecret', () => {
  beforeAll(async () => {
    setArgv({ host: 'http://localhost', secret: 'test' });
    const server = await createServer();
    await setTestApp(server);
  });

  it.each([
    { sslKey: 'private key', incomplete: false },
    { sslKey: null, incomplete: true },
  ])(
    'should return the certificate and whether a private key is set ($incomplete)',
    async ({ incomplete, sslKey }) => {
      const user = await createTestUser();
      const organization = await Organization.create({ id: 'testorganization' });
      await OrganizationMember.create({
        OrganizationId: organization.id,
        UserId: user.id,
        role: PredefinedOrganizationRole.Owner,
      });
      const app = await App.create({
        OrganizationId: organization.id,
        vapidPublicKey: '',
        vapidPrivateKey: '',
        definition: {},
        sslCertificate: 'certificate',
        sslKey,
      });
      authorizeStudio();

      const response = await request.get(`/api/apps/${app.id}/secrets/ssl`);

      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual({ certificate: 'certificate', incomplete });
    },
  );
});
