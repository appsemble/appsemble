import { createGetTeams } from '@appsemble/node-utils';
import { type Middleware } from 'koa';

import { options } from '../options/options.js';

export const getTeams: Middleware = createGetTeams(options);
