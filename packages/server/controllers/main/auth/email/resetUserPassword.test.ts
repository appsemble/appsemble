import { request, setTestApp } from 'axios-test-instance';
import type Koa from 'koa';
import { beforeAll, describe, expect, it } from 'vitest';

import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';

let server: Koa;

describe('resetUserPassword', () => {
  beforeAll(async () => {
    setArgv({ host: 'http://localhost', secret: 'test' });
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
});
