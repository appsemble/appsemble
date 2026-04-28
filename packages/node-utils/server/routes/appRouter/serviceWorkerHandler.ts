import { readFile } from 'node:fs/promises';

import { type Context, type Middleware } from 'koa';

export function createServiceWorkerHandler(): Middleware {
  return async (ctx: Context) => {
    const production = process.env.NODE_ENV === 'production';

    const filename = production ? '/service-worker.js' : '/app/service-worker.js';

    const serviceWorker = await (production
      ? readFile(new URL('../../../../../dist/app/service-worker.js', import.meta.url), 'utf8')
      : ctx.fs.promises.readFile(filename, 'utf8'));

    ctx.body = serviceWorker;
    ctx.type = 'application/javascript';
  };
}
