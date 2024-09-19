import { createDeleteAppResourceController } from '@appsemble/node-utils';
import { type Middleware } from 'koa';

import { options } from '../../../../options/options.js';

export const deleteAppResource: Middleware = createDeleteAppResourceController(options);
