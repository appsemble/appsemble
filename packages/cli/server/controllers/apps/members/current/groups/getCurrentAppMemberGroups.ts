import { createGetCurrentAppMemberGroupsController } from '@appsemble/node-utils';
import { type Middleware } from 'koa';

import { options } from '../../../../../options/options.js';

export const getCurrentAppMemberGroups: Middleware =
  createGetCurrentAppMemberGroupsController(options);
