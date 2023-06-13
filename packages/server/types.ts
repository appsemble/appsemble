import { type Mailer } from './utils/email/Mailer.js';

declare module 'koa' {
  interface DefaultContext {
    mailer: Mailer;
  }
}
