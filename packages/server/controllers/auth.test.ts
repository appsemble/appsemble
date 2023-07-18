import { jwtPattern } from '@appsemble/utils';
import { request, setTestApp } from 'axios-test-instance';
import { compare } from 'bcrypt';

import { EmailAuthorization, ResetPasswordToken, User } from '../models/index.js';
import { setArgv } from '../utils/argv.js';
import { createServer } from '../utils/createServer.js';
import { useTestDatabase } from '../utils/test/testSchema.js';

useTestDatabase(import.meta);

beforeAll(async () => {
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer();
  await setTestApp(server);
});

describe('registerEmail', () => {
  it('should register valid email addresses', async () => {
    const data = { email: 'test@example.com', password: 'password', timezone: 'Europe/Amsterdam' };
    const response = await request.post('/api/email', data);

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

    const email = await EmailAuthorization.findByPk('test@example.com');
    const user = await User.findByPk(email.UserId);

    expect(user.password).not.toBe('password');
    expect(await compare(data.password, user.password)).toBe(true);
  });

  it('should accept a display name', async () => {
    const data = {
      email: 'test@example.com',
      name: 'Me',
      password: 'password',
      timezone: 'Europe/Amsterdam',
    };
    const response = await request.post('/api/email', data);

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

    const email = await EmailAuthorization.findByPk('test@example.com');
    const user = await User.findByPk(email.UserId);

    expect(user.name).toBe('Me');
  });

  it('should not register invalid email addresses', async () => {
    const response = await request.post('/api/email', {
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
            "message": "does not conform to the \\"email\\" format",
            "name": "format",
            "path": [
              "email",
            ],
            "property": "instance.email",
            "schema": {
              "format": "email",
              "type": "string",
            },
            "stack": "instance.email does not conform to the \\"email\\" format",
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
    await EmailAuthorization.create({
      email: 'test@example.com',
      password: 'unhashed',
    });
    const response = await request.post('/api/email', {
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

describe('verifyEmail', () => {
  it('should verify existing email addresses', async () => {
    await request.post('/api/email', {
      email: 'test@example.com',
      password: 'password',
      timezone: 'Europe/Amsterdam',
    });
    const email = await EmailAuthorization.findByPk('test@example.com');

    expect(email.verified).toBe(false);
    expect(email.key).not.toBeNull();

    const response = await request.post('/api/email/verify', { token: email.key });
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: text/plain; charset=utf-8

      OK
    `);

    await email.reload();
    expect(email.verified).toBe(true);
    expect(email.key).toBeNull();
  });

  it('should not verify empty or invalid keys', async () => {
    const responseA = await request.post('/api/email/verify');
    const responseB = await request.post('/api/email/verify', { token: null });
    const responseC = await request.post('/api/email/verify', { token: 'invalidkey' });

    expect(responseA).toMatchInlineSnapshot(`
      HTTP/1.1 415 Unsupported Media Type
      Content-Type: text/plain; charset=utf-8

      Unsupported Media Type
    `);
    expect(responseB).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "errors": [
          {
            "argument": [
              "string",
            ],
            "instance": null,
            "message": "is not of a type(s) string",
            "name": "type",
            "path": [
              "token",
            ],
            "property": "instance.token",
            "schema": {
              "type": "string",
            },
            "stack": "instance.token is not of a type(s) string",
          },
        ],
        "message": "JSON schema validation failed",
      }
    `);
    expect(responseC).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Unable to verify this token.",
        "statusCode": 404,
      }
    `);
  });
});

describe('requestResetPassword', () => {
  it('should create a password reset token', async () => {
    const data = { email: 'test@example.com', password: 'password', timezone: 'Europe/Amsterdam' };
    await request.post('/api/email', data);

    const responseA = await request.post('/api/email/reset/request', { email: data.email });

    const email = await EmailAuthorization.findOne({ where: { email: data.email } });

    const token = await ResetPasswordToken.findOne({
      where: { UserId: email.UserId },
      include: [User],
    });

    const responseB = await request.post('/api/email/reset', {
      token: token.token,
      password: 'newPassword',
    });

    const user = token.User;
    await user.reload();

    expect(responseA).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(responseB).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(await compare('newPassword', user.password)).toBe(true);

    // Sequelize throws errors when trying to load in null objects.
    await expect(token.reload()).rejects.toThrow(
      'Instance could not be reloaded because it does not exist anymore (find call returned null)',
    );
  });

  it('should not reveal existing emails', async () => {
    const response = await request.post('/api/email/reset/request', {
      email: 'idonotexist@example.com',
    });

    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
  });
});

describe('resetPassword', () => {
  it('should return not found when resetting using a non-existent token', async () => {
    const response = await request.post('/api/email/reset', {
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
});
