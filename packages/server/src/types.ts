import { DefaultState, ParameterizedContext } from 'koa';
import * as compose from 'koa-compose';

import { User } from './models';
import { Mailer } from './utils/email/Mailer';

declare module 'koa' {
  interface Request {
    body: any;
  }
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

  /**
   * The user that is logged in.
   */
  users: {
    /**
     * The user that is logged in using an app.
     */
    app: User;

    /**
     * The user that is logged in using client credentials.
     */
    cli: User;

    /**
     * The user that is logged in using Appsemble studio.
     */
    studio: User;
  };
}

export type KoaContext<P = unknown> = ParameterizedContext<DefaultState, AppsembleContext<P>>;

export type KoaMiddleware<P = unknown> = compose.Middleware<KoaContext<P>>;
