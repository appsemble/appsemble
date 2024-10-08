import { type Middleware } from 'koa';

import { type Options } from '../../../types.js';
import { createProxyHandler } from '../../../utils/actions.js';

export function createProxyDeleteController(options: Options): Middleware {
  return createProxyHandler(false, options);
}
