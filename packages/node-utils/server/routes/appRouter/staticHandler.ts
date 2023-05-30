import { fileURLToPath } from 'node:url';

import { type Middleware } from 'koa';
import serve from 'koa-static';

export function createStaticHandler(name: string): Middleware {
  return serve(fileURLToPath(new URL(`../../dist/${name}`, import.meta.url)), {
    index: false,
    maxAge: 365 * 24 * 60 * 60 * 1000,
  });
}
