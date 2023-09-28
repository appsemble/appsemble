import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { getDB } from '../models/index.js';
import { setArgv } from '../utils/argv.js';
import { createServer } from '../utils/createServer.js';
import { useTestDatabase } from '../utils/test/testSchema.js';

useTestDatabase(import.meta);

beforeAll(async () => {
  setArgv({ host: 'http://localhost', secret: 'test' });

  const server = await createServer();
  await setTestApp(server);
});

describe('checkHealth', () => {
  it('should return status ok if all services are connected properly', async () => {
    const response = await request.get('/api/health');

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "database": true,
      }
    `);
  });

  it('should fail if the database is disconnected', async () => {
    vi.spyOn(getDB(), 'authenticate').mockRejectedValue(new Error('stub'));
    const response = await request.get('/api/health');

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 503 Service Unavailable
      Content-Type: application/json; charset=utf-8

      {
        "data": {
          "database": false,
        },
        "error": "Service Unavailable",
        "message": "API unhealthy",
        "statusCode": 503,
      }
    `);
  });
});
