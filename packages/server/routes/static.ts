import { fileURLToPath } from 'node:url';

import { type Middleware } from 'koa';
import serve from 'koa-static';

/**
 * @param name The folder containing static assets inside the dist dir
 * @returns Koa middleware which serves the specified dist directory.
 */
export function staticHandler(name: string): Middleware {
  return serve(fileURLToPath(new URL(`../../dist/${name}`, import.meta.url)), {
    index: false,
    maxAge: 365 * 24 * 60 * 60 * 1000,
  });
}
