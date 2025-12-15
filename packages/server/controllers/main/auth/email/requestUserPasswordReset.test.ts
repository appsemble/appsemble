import { request, setTestApp } from 'axios-test-instance';
import { compare } from 'bcrypt';
import type Koa from 'koa';
import { beforeAll, describe, expect, it } from 'vitest';

import { EmailAuthorization, ResetPasswordToken, User } from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';

let server: Koa;

describe('requestUserPasswordReset', () => {
  beforeAll(async () => {
    setArgv({ host: 'http://localhost', secret: 'test' });
    server = await createServer();
    await setTestApp(server);
  });

  it('should create a password reset token', async () => {
    const data = { email: 'test@example.com', password: 'password', timezone: 'Europe/Amsterdam' };
    await request.post('/api/auth/email/register', data);

    const responseA = await request.post('/api/auth/email/request-password-reset', {
      email: data.email,
    });

    const email = (await EmailAuthorization.findOne({ where: { email: data.email } }))!;

    const token = (await ResetPasswordToken.findOne({
      where: { UserId: email.UserId },
      include: [User],
    }))!;

    const responseB = await request.post('/api/auth/email/reset-password', {
      token: token.token,
      password: 'newPassword',
    });

    const user = token.User!;
    await user.reload();

    expect(responseA).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(responseB).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(await compare('newPassword', user.password!)).toBe(true);

    // Sequelize throws errors when trying to load in null objects.
    await expect(token.reload()).rejects.toThrowError(
      'Instance could not be reloaded because it does not exist anymore (find call returned null)',
    );
  });

  it('should not reveal existing emails', async () => {
    const response = await request.post('/api/auth/email/request-password-reset', {
      email: 'idonotexist@example.com',
    });

    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
  });
});
