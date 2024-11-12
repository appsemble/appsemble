import type NodeCache from '@cacheable/node-cache';

import { type Mailer } from './utils/email/Mailer.js';

declare module 'koa' {
  interface DefaultContext {
    mailer: Mailer;
    assetsCache: NodeCache;
  }
}
