import { request, setTestApp } from 'axios-test-instance';
import type Koa from 'koa';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { type User } from '../../../../models/main/User.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../utils/test/authorization.js';

let server: Koa;
let user: User;

describe('patchPassword', () => {
  beforeAll(async () => {
    setArgv({ host: 'http://localhost', secret: 'test' });
    server = await createServer();
    await setTestApp(server);
  });

  beforeEach(async () => {
    user = await createTestUser();
  });

  it('should change the password of the user', async () => {
    authorizeStudio(user);

    const response = await request.post('/api/auth/email/patch-password', {
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
    authorizeStudio(user);
    const response = await request.post('/api/auth/email/patch-password', {
      newPassword: 'whatever',
      currentPassword: `wrong ${user.password}`,
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
