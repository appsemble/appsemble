import { createGetAppVariablesController } from '@appsemble/node-utils';
import { type Middleware } from 'koa';

import { options } from '../../../../options/options.js';

export const getAppVariables: Middleware = createGetAppVariablesController(options);
