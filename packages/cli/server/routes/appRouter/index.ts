import { createAppRouter } from '@appsemble/node-utils';
import { type Middleware } from 'koa';

import { options } from '../../options/options.js';

export function appRouter(): Middleware {
  return createAppRouter(options);
}
