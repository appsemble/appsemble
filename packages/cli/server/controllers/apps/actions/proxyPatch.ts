import { createProxyPatchController } from '@appsemble/node-utils';
import { type Middleware } from 'koa';

import { options } from '../../../options/options.js';

export const proxyPatch: Middleware = createProxyPatchController(options);
