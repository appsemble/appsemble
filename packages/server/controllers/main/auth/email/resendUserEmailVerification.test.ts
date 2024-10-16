import { request, setTestApp } from 'axios-test-instance';
import { hash } from 'bcrypt';
import type Koa from 'koa';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { EmailAuthorization, User } from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { authorizeStudio } from '../../../../utils/test/authorization.js';

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
});
