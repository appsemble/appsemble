import { request, setTestApp } from 'axios-test-instance';
import type Koa from 'koa';
import { beforeAll, describe, expect, it } from 'vitest';

import { EmailAuthorization } from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';

let server: Koa;

describe('verifyUserEmail', () => {
  beforeAll(async () => {
    setArgv({ host: 'http://localhost', secret: 'test' });
    server = await createServer();
    await setTestApp(server);
  });

  it('should verify existing email addresses', async () => {
    await request.post('/api/auth/email/register', {
      email: 'test@example.com',
      password: 'password',
      timezone: 'Europe/Amsterdam',
    });
    const email = (await EmailAuthorization.findByPk('test@example.com'))!;

    expect(email.verified).toBe(false);
    expect(email.key).not.toBeNull();

    const response = await request.post('/api/auth/email/verify', { token: email.key });
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
    const responseA = await request.post('/api/auth/email/verify');
    const responseB = await request.post('/api/auth/email/verify', { token: null });
    const responseC = await request.post('/api/auth/email/verify', { token: 'invalidkey' });

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
