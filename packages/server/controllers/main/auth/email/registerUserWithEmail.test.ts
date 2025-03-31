import { jwtPattern } from '@appsemble/utils';
import { request, setTestApp } from 'axios-test-instance';
import { compare } from 'bcrypt';
import type Koa from 'koa';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { EmailAuthorization, User } from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';

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
});
