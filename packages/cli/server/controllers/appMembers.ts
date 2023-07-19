import { createGetAppMember } from '@appsemble/node-utils';
import { type Middleware } from 'koa';

import { options } from '../options/options.js';

export const getAppMember: Middleware = createGetAppMember(options);
