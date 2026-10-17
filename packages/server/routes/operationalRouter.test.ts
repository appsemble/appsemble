import { version } from '@appsemble/node-utils';
import { request, setTestApp } from 'axios-test-instance';
import { ConnectionRefusedError } from 'sequelize';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { getDB } from '../models/index.js';
import { setArgv } from '../utils/argv.js';
import { createServer } from '../utils/createServer.js';
import { startDraining } from '../utils/health.js';

// The readiness result is cached per process. Every test starts a minute after the previous one,
// so it always begins with an expired cache.
let now = Date.now();

describe('operationalRouter', () => {
  beforeAll(async () => {
    setArgv({ host: 'http://localhost', secret: 'test' });
    const server = await createServer();
    await setTestApp(server);
  });

  beforeEach(() => {
    now += 60_000;
    vi.useFakeTimers({ now });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should report the process as up without consulting any dependency', async () => {
    vi.spyOn(getDB(), 'authenticate').mockRejectedValue(new Error('stub'));

    const response = await request.get('/health/live');

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "checks": [],
        "status": "UP",
      }
    `);
  });

  it('should answer probes on any hostname', async () => {
    const response = await request.get('/health/live', {
      headers: { host: 'app.example.com' },
    });

    expect(response.status).toBe(200);
    expect(response.data).toStrictEqual({ status: 'UP', checks: [] });
  });

  it('should report the instance as ready when the database answers', async () => {
    const response = await request.get('/health/ready');

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

  it('should report the instance as not ready when the database is unavailable', async () => {
    vi.spyOn(getDB(), 'authenticate').mockRejectedValue(
      new ConnectionRefusedError(new Error('connect ECONNREFUSED')),
    );

    const response = await request.get('/health/ready');

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 503 Service Unavailable
      Content-Type: application/json; charset=utf-8

      {
        "checks": [
          {
            "data": {
              "detail": "SequelizeConnectionRefusedError",
            },
            "name": "database",
            "status": "DOWN",
          },
        ],
        "status": "DOWN",
      }
    `);
  });

  it('should report the build that is answering', async () => {
    vi.stubEnv('GIT_COMMIT', '0123456789abcdef0123456789abcdef01234567');
    vi.stubEnv('BUILD_TIME', '2026-09-14T12:00:00Z');

    const response = await request.get('/version');

    expect(response.status).toBe(200);
    expect(response.data).toStrictEqual({
      version,
      commit: '0123456789abcdef0123456789abcdef01234567',
      built: '2026-09-14T12:00:00Z',
    });
  });

  it('should report the instance as not ready while draining', async () => {
    startDraining();

    const response = await request.get('/health/ready');

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 503 Service Unavailable
      Content-Type: application/json; charset=utf-8

      {
        "checks": [
          {
            "name": "draining",
            "status": "DOWN",
          },
        ],
        "status": "DOWN",
      }
    `);
  });
});
