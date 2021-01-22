import { DefaultState, ParameterizedContext } from 'koa';
import * as compose from 'koa-compose';

import { User } from './models';
import { Mailer } from './utils/email/Mailer';

declare module 'koa' {
  interface Request {
    body: any;
  }
}

export interface AppsembleState extends DefaultState {
  render: (template: string, params: Record<string, unknown>) => Promise<string>;
}

export interface AppsembleContext<P = unknown> {
  /**
   * The client the request is from including its scopes
   */
  clients?: {
    app?: { scope: string };
    cli?: { scope: string };
  };

  mailer: Mailer;

  /**
   * URL parameters either from Koas or tinyRouter.
   */
  params: P;

  /**
   * The user that is logged in.
   */
  user: User;
}

export type KoaContext<P = unknown> = ParameterizedContext<AppsembleState, AppsembleContext<P>>;

export type KoaMiddleware<P = unknown> = compose.Middleware<KoaContext<P>>;
