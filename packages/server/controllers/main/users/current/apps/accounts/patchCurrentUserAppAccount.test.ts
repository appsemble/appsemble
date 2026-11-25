import { createFormData } from '@appsemble/node-utils';
import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, expect, it } from 'vitest';

import { App, getAppDB, Organization } from '../../../../../../models/index.js';
import { setArgv } from '../../../../../../utils/argv.js';
import { createServer } from '../../../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../../../utils/test/authorization.js';

beforeAll(async () => {
  setArgv({ host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' });
  const server = await createServer();
  await setTestApp(server);
});

it('should not report success if the update fails', async () => {
  const user = await createTestUser();
  await Organization.create({ id: 'org', name: 'Test Organization' });
  const app = await App.create({
    OrganizationId: 'org',
    definition: {},
    vapidPublicKey: 'a',
    vapidPrivateKey: 'b',
  });
  const { AppMember } = await getAppDB(app.id);
  await AppMember.create({ email: user.primaryEmail, userId: user.id });
  authorizeStudio();

  const { status } = await request.patch(
    `/api/users/current/apps/${app.id}/account`,
    createFormData({ name: 'a'.repeat(256) }),
  );

  expect(status).toBe(500);
});
