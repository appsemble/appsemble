import { createProxyGetController } from '@appsemble/node-utils';
import { type Middleware } from 'koa';

import { options } from '../../../options/options.js';

export const proxyGet: Middleware = createProxyGetController(options);
