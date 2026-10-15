import { type Server } from 'node:http';

import { startDraining } from './health.js';
import { closeDBs } from '../models/index.js';

/**
 * Stop serving without dropping requests.
 *
 * Readiness reports `DOWN` first, so a load balancer that watches it stops sending traffic without
 * waiting for its next probe. The server then refuses new connections while the requests in flight
 * are finished, and the database connections are released once those are done.
 *
 * @param httpServer The listening HTTP server to drain.
 */
export async function shutdown(httpServer: Server): Promise<void> {
  startDraining();
  await new Promise<void>((resolve, reject) => {
    httpServer.close((error) => (error ? reject(error) : resolve()));
  });
  await closeDBs();
}
