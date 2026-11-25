import { request, setTestApp } from 'axios-test-instance';
import { compare } from 'bcrypt';
import type Koa from 'koa';
import { beforeAll, describe, expect, it } from 'vitest';

import { EmailAuthorization, ResetPasswordToken, User } from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../utils/test/authorization.js';
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

  it('should reject a verification link issued before the password was reset', async () => {
    await request.post('/api/auth/email/register', {
      email: 'test@example.com',
      password: 'password',
      timezone: 'Europe/Amsterdam',
    });
    const { key: verificationToken } = (await EmailAuthorization.findByPk('test@example.com'))!;
    await request.post('/api/auth/email/request-password-reset', { email: 'test@example.com' });
    const { token: resetToken } = (await ResetPasswordToken.findOne())!;
    await request.post('/api/auth/email/reset-password', {
      token: resetToken,
      password: 'new password',
    });

    const response = await request.post('/api/auth/email/verify', { token: verificationToken });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Unable to verify this token.",
        "statusCode": 404,
      }
    `);
  });

  it('should reject a secondary email verification link issued before the password was reset', async () => {
    const user = await createTestUser();
    authorizeStudio(user);
    await request.post('/api/users/current/emails', { email: 'secondary@example.com' });
    const { key: verificationToken } =
      (await EmailAuthorization.findByPk('secondary@example.com'))!;
    await ResetPasswordToken.create({ token: 'reset-token', UserId: user.id });
    await request.post('/api/auth/email/reset-password', {
      token: 'reset-token',
      password: 'new password',
    });

    const response = await request.post('/api/auth/email/verify', { token: verificationToken });

    expect(response.status).toBe(404);
  });

  it('should verify the email address the reset link was sent to', async () => {
    await request.post('/api/auth/email/register', {
      email: 'test@example.com',
      password: 'password',
      timezone: 'Europe/Amsterdam',
    });
    await request.post('/api/auth/email/request-password-reset', { email: 'test@example.com' });
    const { token } = (await ResetPasswordToken.findOne())!;

    await request.post('/api/auth/email/reset-password', { token, password: 'new password' });

    const { verified } = (await EmailAuthorization.findByPk('test@example.com'))!;
    expect(verified).toBe(true);
  });
});
