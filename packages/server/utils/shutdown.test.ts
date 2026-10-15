import { Agent, createServer, request } from 'node:http';
import { type AddressInfo, connect } from 'node:net';

import { expect, it } from 'vitest';

import { getReadiness } from './health.js';
import { shutdown } from './shutdown.js';
import { getDB } from '../models/index.js';

/**
 * Open a bare TCP connection, to tell a server that refuses connections from one that accepts them.
 *
 * @param port The port to connect to.
 * @returns A promise that resolves once the connection is established.
 */
function connectTo(port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = connect(port, '127.0.0.1');
    socket.on('connect', () => {
      socket.destroy();
      resolve();
    });
    socket.on('error', reject);
  });
}

// Draining and closing the database are one-way, so this file holds a single test.
it('should finish a request in flight before it stops serving and releases the database', async () => {
  let respond: () => void;
  let requestReceived: () => void;
  const responseReleased = new Promise<void>((resolve) => {
    respond = resolve;
  });
  const received = new Promise<void>((resolve) => {
    requestReceived = resolve;
  });

  // The handler queries the database after it is released, because a request in flight keeps
  // serving only if its connections outlive the drain.
  const server = createServer(async (req, res) => {
    requestReceived();
    await responseReleased;
    try {
      await getDB().authenticate();
      res.end('finished');
    } catch {
      res.end('database closed');
    }
  });
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address() as AddressInfo;

  // A keep-alive client, like the ingress proxy in front of the server in production.
  const agent = new Agent({ keepAlive: true, keepAliveMsecs: 60_000 });
  const body = new Promise<string>((resolve, reject) => {
    const clientRequest = request({ agent, host: '127.0.0.1', port }, (response) => {
      response.setEncoding('utf8');
      let data = '';
      response.on('data', (chunk: string) => {
        data += chunk;
      });
      response.on('end', () => resolve(data));
    });
    clientRequest.on('error', reject);
    clientRequest.end();
  });
  await received;

  let stopped = false;
  const stopping = shutdown(server).then(() => {
    stopped = true;
  });

  expect(await getReadiness()).toStrictEqual({
    status: 'DOWN',
    checks: [{ name: 'draining', status: 'DOWN' }],
  });
  await expect(connectTo(port)).rejects.toThrow('ECONNREFUSED');
  expect(stopped).toBe(false);

  respond!();
  expect(await body).toBe('finished');
  // Release the idle connection, as a client does when it is done with it.
  agent.destroy();

  await stopping;
  await expect(getDB().authenticate()).rejects.toThrow(/connection manager was closed/);
});
