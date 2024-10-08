import { createGetCurrentAppMemberController } from '@appsemble/node-utils';
import { type Middleware } from 'koa';

import { options } from '../../../../options/options.js';

export const getCurrentAppMember: Middleware = createGetCurrentAppMemberController(options);
