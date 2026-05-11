import { createServer as createNetServer, type Server } from 'node:net';

import { request, setTestApp } from 'axios-test-instance';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { getDB } from '../../models/index.js';
import { setArgv } from '../../utils/argv.js';
import { createServer } from '../../utils/createServer.js';

async function createValkeyServer(getResponse: (command: string) => string): Promise<Server> {
  const server = createNetServer((socket) => {
    socket.on('data', (data) => {
      socket.write(getResponse(String(data)));
    });
  });

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  return server;
}

describe('checkHealth', () => {
  let valkeyServer: Server | undefined;

  beforeAll(async () => {
    setArgv({ host: 'http://localhost', secret: 'test' });

    const server = await createServer();
    await setTestApp(server);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    setArgv({ host: 'http://localhost', secret: 'test' });

    await new Promise<void>((resolve, reject) => {
      if (!valkeyServer) {
        resolve();
        return;
      }

      valkeyServer.close((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
      valkeyServer = undefined;
    });
  });

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

  it('should check Valkey if configured', async () => {
    valkeyServer = await createValkeyServer((command) =>
      command.includes('AUTH') ? '+OK\r\n' : '+PONG\r\n',
    );
    const address = valkeyServer.address();
    if (address == null || typeof address === 'string') {
      throw new TypeError('Expected Valkey test server to listen on a TCP port');
    }
    setArgv({
      host: 'http://localhost',
      secret: 'test',
      valkeyHost: '127.0.0.1',
      valkeyPassword: 'password',
      valkeyPort: address.port,
    });

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
        },
        "error": "Service Unavailable",
        "message": "API unhealthy",
        "statusCode": 503,
      }
    `);
  });

  it('should fail if Valkey is disconnected', async () => {
    valkeyServer = await createValkeyServer(() => '-ERR unavailable\r\n');
    const address = valkeyServer.address();
    if (address == null || typeof address === 'string') {
      throw new TypeError('Expected Valkey test server to listen on a TCP port');
    }
    setArgv({
      host: 'http://localhost',
      secret: 'test',
      valkeyHost: '127.0.0.1',
      valkeyPort: address.port,
    });

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
