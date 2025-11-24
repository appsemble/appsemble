import { request, setTestApp } from 'axios-test-instance';
import type Koa from 'koa';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { App, type AppMember, Organization } from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { authorizeAppMember, createTestAppMember } from '../../../../utils/test/authorization.js';

let server: Koa;
let app: App;
let member: AppMember;

describe('patchAppMemberPassword', () => {
  beforeAll(async () => {
    setArgv({ host: 'http://localhost', secret: 'test' });
    server = await createServer();
    await setTestApp(server);
  });

  beforeEach(async () => {
    const organization = await Organization.create({ id: 'appsemble' });
    app = await App.create({
      definition: {
        name: 'Test App',
        description: 'Test App',
      },
      OrganizationId: organization.id,
      vapidPublicKey: '',
      vapidPrivateKey: '',
    });
    member = await createTestAppMember(app.id);
  });

  it('should change the password of the user', async () => {
    authorizeAppMember(app, member);

    const response = await request.patch(`/api/apps/${app.id}/auth/email/password`, {
      newPassword: 'newpassword1',
      currentPassword: 'testpassword',
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: text/plain; charset=utf-8

      OK
    `);
  });

  it('should return a 401 Unauthorized if logged in but current password input is wrong', async () => {
    authorizeAppMember(app, member);
    const response = await request.patch(`/api/apps/${app.id}/auth/email/password`, {
      newPassword: 'whatever',
      currentPassword: `wrong ${member.password}`,
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 401 Unauthorized
      Content-Type: application/json; charset=utf-8

      {
        "error": "Unauthorized",
        "message": "Old password is incorrect.",
        "statusCode": 401,
      }
    `);
  });
});
