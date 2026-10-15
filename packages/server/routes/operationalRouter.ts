import { tinyRouter, version } from '@appsemble/node-utils';
import { type Context, type Middleware } from 'koa';

import { getReadiness } from '../utils/health.js';

/**
 * Report that the process is up.
 *
 * The liveness and startup probes restart the container on failure, so this touches nothing that
 * could fail: no dependency can make it report anything other than `UP`.
 *
 * @param ctx The Koa context.
 */
function liveHandler(ctx: Context): void {
  ctx.body = { status: 'UP', checks: [] };
}

/**
 * Report whether this instance should receive traffic.
 *
 * @param ctx The Koa context.
 */
async function readyHandler(ctx: Context): Promise<void> {
  const readiness = await getReadiness();
  ctx.status = readiness.status === 'UP' ? 200 : 503;
  ctx.body = readiness;
}

/**
 * Report which build is answering. The commit and build time are stamped into the Docker image.
 *
 * @param ctx The Koa context.
 */
function versionHandler(ctx: Context): void {
  ctx.body = { version, commit: process.env.GIT_COMMIT, built: process.env.BUILD_TIME };
}

/**
 * The operational endpoints read by probes and monitors.
 *
 * These are served on every hostname, before any app or app collection lookup, so a probe never
 * touches the database to find out whether the process is up.
 */
export const operationalRouter: Middleware = tinyRouter([
  {
    route: '/health/live',
    get: liveHandler,
  },
  {
    route: '/health/ready',
    get: readyHandler,
  },
  {
    route: '/version',
    get: versionHandler,
  },
]);
