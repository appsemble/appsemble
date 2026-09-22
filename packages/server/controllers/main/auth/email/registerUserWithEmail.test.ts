import { createServer as createTcpServer, type AddressInfo } from 'node:net';

import { jwtPattern, noop } from '@appsemble/utils';
import { request, setTestApp } from 'axios-test-instance';
import { compare } from 'bcrypt';
import { Redis } from 'ioredis';
import type Koa from 'koa';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { EmailAuthorization, User } from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { getValkeyClient } from '../../../../utils/valkey.js';

vi.mock('../../../../utils/valkey.js', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../../../../utils/valkey.js')>();
  return { ...mod, getValkeyClient: vi.fn(mod.getValkeyClient) };
});

let server: Koa;

describe('registerUserWithEmail', () => {
  beforeAll(async () => {
    setArgv({ host: 'http://localhost', secret: 'test' });
    server = await createServer();
    await setTestApp(server);
  });

  it('should register valid email addresses', async () => {
    const spy = vi.spyOn(server.context.mailer, 'sendTranslatedEmail');
    const data = {
      email: 'test@example.com',
      password: 'password',
      timezone: 'Europe/Amsterdam',
      name: 'Me',
      locale: 'nl',
    };
    const response = await request.post('/api/auth/email/register', data);

    expect(response).toMatchInlineSnapshot(
      {
        data: {
          access_token: expect.stringMatching(jwtPattern),
          refresh_token: expect.stringMatching(jwtPattern),
        },
      },
      `
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      {
        "access_token": StringMatching /\\^\\[\\\\w-\\]\\+\\(\\?:\\\\\\.\\[\\\\w-\\]\\+\\)\\{2\\}\\$/,
        "expires_in": 3600,
        "refresh_token": StringMatching /\\^\\[\\\\w-\\]\\+\\(\\?:\\\\\\.\\[\\\\w-\\]\\+\\)\\{2\\}\\$/,
        "token_type": "bearer",
      }
    `,
    );

    const email = (await EmailAuthorization.findByPk('test@example.com'))!;
    const user = (await User.findByPk(email.UserId))!;

    expect(user.password).not.toBe('password');
    expect(await compare(data.password, user.password!)).toBe(true);

    expect(server.context.mailer.sendTranslatedEmail).toHaveBeenCalledWith({
      emailName: 'welcome',
      locale: 'nl',
      to: {
        email: 'test@example.com',
        name: 'Me',
      },
      values: {
        appName: 'null',
        link: expect.any(Function),
        name: 'Me',
      },
    });
    spy.mockRestore();
  });

  it('should accept a display name', async () => {
    const data = {
      email: 'test@example.com',
      name: 'Me',
      password: 'password',
      timezone: 'Europe/Amsterdam',
    };
    const response = await request.post('/api/auth/email/register', data);

    expect(response).toMatchInlineSnapshot(
      {
        data: {
          access_token: expect.stringMatching(jwtPattern),
          refresh_token: expect.stringMatching(jwtPattern),
        },
      },
      `
      HTTP/1.1 201 Created
      Content-Type: application/json; charset=utf-8

      {
        "access_token": StringMatching /\\^\\[\\\\w-\\]\\+\\(\\?:\\\\\\.\\[\\\\w-\\]\\+\\)\\{2\\}\\$/,
        "expires_in": 3600,
        "refresh_token": StringMatching /\\^\\[\\\\w-\\]\\+\\(\\?:\\\\\\.\\[\\\\w-\\]\\+\\)\\{2\\}\\$/,
        "token_type": "bearer",
      }
    `,
    );

    const email = (await EmailAuthorization.findByPk('test@example.com'))!;
    const user = (await User.findByPk(email.UserId))!;

    expect(user.name).toBe('Me');
  });

  it('should not register invalid email addresses', async () => {
    const response = await request.post('/api/auth/email/register', {
      email: 'foo',
      password: 'bar',
      timezone: 'Europe/Amsterdam',
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "errors": [
          {
            "argument": "email",
            "instance": "foo",
            "message": "does not conform to the "email" format",
            "name": "format",
            "path": [
              "email",
            ],
            "property": "instance.email",
            "schema": {
              "format": "email",
              "type": "string",
            },
            "stack": "instance.email does not conform to the "email" format",
          },
          {
            "argument": 8,
            "instance": "bar",
            "message": "does not meet minimum length of 8",
            "name": "minLength",
            "path": [
              "password",
            ],
            "property": "instance.password",
            "schema": {
              "minLength": 8,
              "type": "string",
            },
            "stack": "instance.password does not meet minimum length of 8",
          },
        ],
        "message": "JSON schema validation failed",
      }
    `);
  });

  it('should not register duplicate email addresses', async () => {
    const user = await User.create({
      primaryEmail: 'test@example.com',
      timezone: 'Europe/Amsterdam',
    });
    await EmailAuthorization.create({
      UserId: user.id,
      email: 'test@example.com',
      password: 'unhashed',
    });
    const response = await request.post('/api/auth/email/register', {
      email: 'test@example.com',
      password: 'password',
      timezone: 'Europe/Amsterdam',
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 409 Conflict
      Content-Type: application/json; charset=utf-8

      {
        "error": "Conflict",
        "message": "User with this email address already exists.",
        "statusCode": 409,
      }
    `);
  });

  it('should not rate limit while Valkey is unavailable', async () => {
    // Reserve a port nothing listens on, then point a client at it.
    const tcpServer = createTcpServer();
    await new Promise<void>((resolve) => {
      tcpServer.listen(0, '127.0.0.1', resolve);
    });
    const { port } = tcpServer.address() as AddressInfo;
    await new Promise<void>((resolve) => {
      tcpServer.close(() => resolve());
    });
    const client = new Redis({
      enableOfflineQueue: false,
      host: '127.0.0.1',
      lazyConnect: true,
      port,
      retryStrategy: () => 5000,
    });
    client.on('error', noop);
    await expect(client.connect()).rejects.toThrow('Connection is closed.');
    vi.mocked(getValkeyClient).mockReturnValue(client);

    const data = { email: 'test@example.com', password: 'password', timezone: 'Europe/Amsterdam' };
    expect((await request.post('/api/auth/email/register', data)).status).toBe(201);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect((await request.post('/api/auth/email/register', data)).status).toBe(409);
    }
    client.disconnect();
  });
});
