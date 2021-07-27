import { Mailer } from './utils/email/Mailer';

declare module 'koa' {
  interface Request {
    body: any;
  }

  interface DefaultContext {
    mailer: Mailer;
  }
}
