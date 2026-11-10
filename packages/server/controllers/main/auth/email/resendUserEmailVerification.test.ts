import { request, setTestApp } from 'axios-test-instance';
import { hash } from 'bcrypt';
import { type FormatXMLElementFn } from 'intl-messageformat';
import type Koa from 'koa';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { EmailAuthorization, ResetPasswordToken, User } from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../../utils/test/authorization.js';

let server: Koa;

describe('resendEmailVerification', () => {
  beforeAll(async () => {
    setArgv({ host: 'http://localhost', secret: 'test' });
    server = await createServer();
    await setTestApp(server);
  });

  it('should re-send the verification email', async () => {
    const email = 'test@example.com';
    const password = await hash('password', 10);
    const user = await User.create({
      primaryEmail: email,
      password,
      timezone: 'Europe/Amsterdam',
      locale: 'en',
    });
    await EmailAuthorization.create({ UserId: user.id, email, verified: false });
    const spy = vi.spyOn(server.context.mailer, 'sendTranslatedEmail');
    authorizeStudio(user);
    const response = await request.post('/api/auth/email/resend-verification', {
      email,
    });
    expect(response.status).toBe(204);
    expect(server.context.mailer.sendTranslatedEmail).toHaveBeenCalledWith({
      emailName: 'resend',
      locale: 'en',
      to: {
        email,
        name: null,
      },
      values: {
        appName: 'null',
        link: expect.any(Function),
        name: 'null',
      },
    });
    spy.mockRestore();
  });

  it('should send a working link for an email left unverified by a password reset', async () => {
    const user = await createTestUser();
    authorizeStudio(user);
    await request.post('/api/users/current/emails', { email: 'secondary@example.com' });
    await ResetPasswordToken.create({ token: 'reset-token', UserId: user.id });
    await request.post('/api/auth/email/reset-password', {
      token: 'reset-token',
      password: 'new password',
    });
    const spy = vi.spyOn(server.context.mailer, 'sendTranslatedEmail');

    await request.post('/api/auth/email/resend-verification', { email: 'secondary@example.com' });

    const link = spy.mock.calls[0][0].values.link as FormatXMLElementFn<string, string>;
    const [, token] = /token=(\w+)/.exec(link(['']))!;
    const response = await request.post('/api/auth/email/verify', { token });
    expect(response.status).toBe(200);
    spy.mockRestore();
  });
});
