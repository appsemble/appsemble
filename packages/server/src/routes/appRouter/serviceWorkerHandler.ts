import { KoaContext } from '../../types';

/**
 * A handler used to serve the service worker output from Webpack from the client root.
 *
 * This should not run in production.
 *
 * @param ctx - The Koa context.
 */
export function serviceWorkerHandler(ctx: KoaContext): void {
  ctx.body = ctx.state.fs.readFileSync('/app/service-worker.js', 'utf8');
  ctx.type = 'application/javascript';
}
