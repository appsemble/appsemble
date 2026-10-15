import { type AddressInfo, connect, createServer, type Server, type Socket } from 'node:net';

import { type Redis } from 'ioredis';
import { afterEach, describe, expect, it, vi } from 'vitest';

const valkeyHost = process.env.VALKEY_HOST || 'localhost';
const valkeyPort = Number(process.env.VALKEY_PORT) || 63_791;
const valkeyPassword = process.env.VALKEY_PASSWORD || 'password';

/**
 * A TCP proxy in front of the test Valkey container, so a test can take Valkey offline and bring
 * it back without touching the container.
 */
class ValkeyProxy {
  port = 0;

  private server: Server | undefined;

  private readonly sockets = new Set<Socket>();

  async start(): Promise<void> {
    const server = createServer((socket) => {
      const upstream = connect(valkeyPort, valkeyHost);
      this.sockets.add(socket).add(upstream);
      socket.pipe(upstream).pipe(socket);
      for (const [end, other] of [
        [socket, upstream],
        [upstream, socket],
      ]) {
        end.on('error', () => end.destroy());
        end.on('close', () => {
          this.sockets.delete(end);
          other.destroy();
        });
      }
    });
    await new Promise<void>((resolve) => {
      server.listen(this.port, '127.0.0.1', resolve);
    });
    this.server = server;
    this.port = (server.address() as AddressInfo).port;
  }

  async stop(): Promise<void> {
    for (const socket of this.sockets) {
      socket.destroy();
    }
    await new Promise<void>((resolve, reject) => {
      this.server!.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

/**
 * Initialize a fresh Valkey client singleton, independent of the one from the test setup.
 *
 * @param port The port the client should connect to.
 * @returns The client.
 */
async function initClient(port: number): Promise<Redis> {
  vi.resetModules();
  const { initValkeyClient } = await import('./valkey.js');
  return (await initValkeyClient({
    host: '127.0.0.1',
    port,
    username: 'default',
    password: valkeyPassword,
  }))!;
}

describe('initValkeyClient', () => {
  const proxy = new ValkeyProxy();
  let client: Redis;

  afterEach(async () => {
    client.disconnect();
    await proxy.stop();
  });

  it('should reconnect after Valkey restarts', async () => {
    await proxy.start();
    client = await initClient(proxy.port);
    expect(await client.ping()).toBe('PONG');

    const closed = new Promise<void>((resolve) => {
      client.once('close', resolve);
    });
    await proxy.stop();
    await closed;
    await expect(client.ping()).rejects.toBeInstanceOf(Error);

    await proxy.start();
    await vi.waitFor(async () => expect(await client.ping()).toBe('PONG'), { timeout: 5000 });
  });

  it('should keep reconnecting when Valkey is unreachable at startup', async () => {
    await proxy.start();
    await proxy.stop();
    client = await initClient(proxy.port);
    await expect(client.ping()).rejects.toBeInstanceOf(Error);

    await proxy.start();
    await vi.waitFor(async () => expect(await client.ping()).toBe('PONG'), { timeout: 5000 });
  });
});
