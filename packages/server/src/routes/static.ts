import { resolve } from 'path';

import serve from 'koa-static';

import { KoaMiddleware } from '../types';

/**
 * @param name - The folder containing static assets inside the disr dir
 * @returns Koa middleware which serves the specified dist directory.
 */
export function staticHandler(name: string): KoaMiddleware {
  return serve(resolve(__dirname, '..', '..', '..', '..', 'dist', name), {
    index: false,
    maxAge: 365 * 24 * 60 * 60 * 1000,
  });
}
