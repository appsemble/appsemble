import { type Middleware } from 'koa';

import { type Options } from '../../../types.js';
import { createProxyHandler } from '../../../utils/actions.js';

export function createProxyPutController(options: Options): Middleware {
  return createProxyHandler(true, options);
}
