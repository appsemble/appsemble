import { DOMParser } from '@xmldom/xmldom';
import { request, setTestApp } from 'axios-test-instance';
import { compare } from 'bcrypt';
import type Koa from 'koa';
import { createTransport } from 'nodemailer';
import { beforeAll, describe, expect, it } from 'vitest';

import { EmailAuthorization, ResetPasswordToken, User } from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { createTestUser } from '../../../../utils/test/authorization.js';

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
    await expect(token.reload()).rejects.toThrow(
      'Instance could not be reloaded because it does not exist anymore (find call returned null)',
    );
  });

  it('should not reveal existing emails', async () => {
    const response = await request.post('/api/auth/email/request-password-reset', {
      email: 'idonotexist@example.com',
    });

    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
  });

  it('preserves the local sign-in continuation in the rendered reset email', async () => {
    const email = 'reset-link@example.com';
    const user = await createTestUser(email);
    await user.update({ locale: 'nl' });
    const outbox: { to: string; html: string }[] = [];
    const { transport } = server.context.mailer;
    server.context.mailer.transport = createTransport({
      name: 'test',
      version: '1.0.0',
      send(message, callback) {
        outbox.push({ to: String(message.data.to), html: String(message.data.html) });
        callback(null, {
          envelope: message.message!.getEnvelope(),
          messageId: message.message!.messageId(),
        });
      },
    });
    const redirect = '/nl/login?redirect=%2Fnl%2Fapps%2F42&organization=staff&personal=1#details';
    try {
      const response = await request.post('/api/auth/email/request-password-reset', {
        email,
        redirect,
      });
      const token = await ResetPasswordToken.findOne();
      const document = new DOMParser().parseFromString(
        outbox.find((message) => message.to.includes(email))!.html,
        'text/html',
      );
      const link = new URL(
        Array.from(document.getElementsByTagName('a'), (anchor) =>
          anchor.getAttribute('href'),
        ).find((href) => href?.includes('/edit-password?'))!,
      );
      expect({
        status: response.status,
        origin: link.origin,
        path: link.pathname,
        parameters: Object.fromEntries(link.searchParams),
      }).toStrictEqual({
        status: 204,
        origin: 'http://localhost',
        path: '/nl/edit-password',
        parameters: { token: token!.token, redirect },
      });
    } finally {
      server.context.mailer.transport = transport;
    }
  });

  it.each(['https://outside.example/', '//outside.example/', '/\\outside.example/', '//['])(
    'rejects the external or malformed continuation %s',
    async (redirect) => {
      const response = await request.post('/api/auth/email/request-password-reset', {
        email: 'test@example.com',
        redirect,
      });
      expect(response).toMatchObject({
        status: 400,
        data: { message: 'The sign-in destination is invalid' },
      });
    },
  );
});
