import { createCreateAppResourceController } from '@appsemble/node-utils';
import { type Middleware } from 'koa';

import { options } from '../../../../options/options.js';

export const createAppResource: Middleware = createCreateAppResourceController(options);
