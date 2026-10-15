import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { getDB } from '../../models/index.js';
import { setArgv } from '../../utils/argv.js';
import { createServer } from '../../utils/createServer.js';

// The readiness result is cached per process. Every test starts a minute after the previous one,
// so it always begins with an expired cache.
let now = Date.now();

describe('checkHealth', () => {
  beforeAll(async () => {
    setArgv({ host: 'http://localhost', secret: 'test' });
    const server = await createServer();
    await setTestApp(server);
  });

  beforeEach(() => {
    now += 60_000;
    vi.useFakeTimers({ now });
  });

  it('should answer like /health/ready', async () => {
    const response = await request.get('/api/health');

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "checks": [
          {
            "data": {
              "detail": "ok",
            },
            "name": "database",
            "status": "UP",
          },
        ],
        "status": "UP",
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
        "checks": [
          {
            "data": {
              "detail": "Error",
            },
            "name": "database",
            "status": "DOWN",
          },
        ],
        "status": "DOWN",
      }
    `);
  });
});
