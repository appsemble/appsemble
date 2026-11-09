import { type AddressInfo, createServer } from 'node:net';

import { onTestFinished } from 'vitest';

/**
 * Listen on 127.0.0.1 and count incoming connections, closing each one immediately.
 *
 * The server is closed when the current test finishes.
 *
 * @returns The port listened on, and the number of connections received so far.
 */
export async function countConnections(): Promise<{ connections: number; port: number }> {
  const counter = { connections: 0, port: 0 };
  const server = createServer((socket) => {
    counter.connections += 1;
    socket.destroy();
  });
  onTestFinished(() => {
    server.close();
  });
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });
  counter.port = (server.address() as AddressInfo).port;
  return counter;
}
