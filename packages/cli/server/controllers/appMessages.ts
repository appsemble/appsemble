import { createGetMessages } from '@appsemble/node-utils';
import { type DefaultContext, type DefaultState, type Middleware } from 'koa';

import { options } from '../options/options.js';

export function getMessages(): Middleware<DefaultState, DefaultContext> {
  return createGetMessages(options);
}
