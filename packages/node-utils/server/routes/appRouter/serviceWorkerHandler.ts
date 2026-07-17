import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

import { type Context, type Middleware } from 'koa';

export function createServiceWorkerHandler(): Middleware {
  return async (ctx: Context) => {
    const production = process.env.NODE_ENV === 'production';

    const filename = production ? '/service-worker.js' : '/app/service-worker.js';

    const serviceWorker = await (production
      ? readFile(new URL('../../../../../dist/app/service-worker.js', import.meta.url), 'utf8')
      : ctx.fs.promises.readFile(filename, 'utf8'));

    ctx.type = 'application/javascript';
    // Browsers bypass their HTTP cache when checking for service worker updates, so a strong ETag
    // lets them revalidate with a 304 instead of downloading the full script on every check.
    ctx.set('etag', `"${createHash('sha256').update(serviceWorker).digest('base64url')}"`);
    ctx.set('cache-control', 'no-cache');
    ctx.status = 200;
    if (ctx.fresh) {
      ctx.status = 304;
    } else {
      ctx.body = serviceWorker;
    }
  };
}
