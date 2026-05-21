import { request, setTestApp } from 'axios-test-instance';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { getDB } from '../../models/index.js';
import { setArgv } from '../../utils/argv.js';
import { createServer } from '../../utils/createServer.js';
import { getValkeyClient } from '../../utils/valkey.js';

vi.mock('../../utils/valkey.js', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../../utils/valkey.js')>();
  return {
    ...mod,
    getValkeyClient: vi.fn(mod.getValkeyClient),
  };
});

describe('checkHealth', () => {
  beforeAll(async () => {
    setArgv({
      host: 'http://localhost',
      secret: 'test',
      valkeyHost: process.env.VALKEY_HOST || 'localhost',
    });

    const server = await createServer();
    await setTestApp(server);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    setArgv({
      host: 'http://localhost',
      secret: 'test',
      valkeyHost: process.env.VALKEY_HOST || 'localhost',
    });
  });

  it('should return status ok if all services are connected properly', async () => {
    const response = await request.get('/api/health');

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "database": true,
        "valkey": true,
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
          "valkey": true,
        },
        "error": "Service Unavailable",
        "message": "API unhealthy",
        "statusCode": 503,
      }
    `);
  });

  it('should fail if Valkey is disconnected', async () => {
    const mockClient = {
      ping: vi.fn().mockRejectedValue(new Error('Valkey is unavailable')),
    };
    vi.mocked(getValkeyClient).mockReturnValue(mockClient as any);

    const response = await request.get('/api/health');

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 503 Service Unavailable
      Content-Type: application/json; charset=utf-8

      {
        "data": {
          "database": true,
          "valkey": false,
        },
        "error": "Service Unavailable",
        "message": "API unhealthy",
        "statusCode": 503,
      }
    `);
  });
});
