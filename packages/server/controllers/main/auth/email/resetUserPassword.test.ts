import { request, setTestApp } from 'axios-test-instance';
import { compare } from 'bcrypt';
import type Koa from 'koa';
import { beforeAll, describe, expect, it } from 'vitest';

import { ResetPasswordToken, User } from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { createTestUser } from '../../../../utils/test/authorization.js';
import { mockPwnedPasswords } from '../../../../utils/test/pwnedPasswords.js';

let server: Koa;

describe('resetUserPassword', () => {
  beforeAll(async () => {
    setArgv({ host: 'http://localhost', rejectBreachedPasswords: true, secret: 'test' });
    server = await createServer();
    await setTestApp(server);
  });

  it('should return not found when resetting using a non-existent token', async () => {
    const response = await request.post('/api/auth/email/reset-password', {
      token: 'idontexist',
      password: 'whatever',
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Unknown password reset token: idontexist",
        "statusCode": 404,
      }
    `);
  });

  it('should not reset the password to a breached password', async () => {
    mockPwnedPasswords(['12345678']);
    const user = await createTestUser();
    await ResetPasswordToken.create({ token: 'reset-token', UserId: user.id });

    const response = await request.post('/api/auth/email/reset-password', {
      token: 'reset-token',
      password: '12345678',
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "data": {
          "breachedPassword": true,
        },
        "error": "Bad Request",
        "message": "This password has appeared in a known data breach. Choose a different password.",
        "statusCode": 400,
      }
    `);
    const { password } = (await User.findByPk(user.id, { attributes: ['password'] }))!;
    expect(await compare('testpassword', password!)).toBe(true);
  });
});
