import type * as fs from 'fs';

import type { ParameterizedContext } from 'koa';
import type * as compose from 'koa-compose';

import type { User } from './models';
import type { Mailer } from './utils/email/Mailer';

declare module 'koa' {
  interface Request {
    body: any;
  }
}

export interface Argv {
  appDomainStrategy?: string;
  databaseHost?: string;
  databasePort?: number;
  databaseUser?: string;
  databasePassword?: string;
  databaseName?: string;
  databaseSsl?: boolean;
  databaseUrl?: string;
  disableRegistration?: boolean;
  host?: string;
  ingressAnnotations?: string;
  serviceName?: string;
  servicePort?: string | number;
  kubernetesServiceHost?: string;
  kubernetesServicePort?: string | number;
  migrateTo?: string;
  port?: number;
  ssl?: boolean;
  sslKey?: string;
  sslCert?: string;
  smtpFrom?: string;
  smtpHost?: string;
  smtpPass?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  githubClientId?: string;
  githubClientSecret?: string;
  gitlabClientId?: string;
  gitlabClientSecret?: string;
  googleClientId?: string;
  googleClientSecret?: string;
  proxy?: true;
  secret?: string;
  sentryDsn?: string;
  to?: string;
}

export interface AppsembleState {
  fs: typeof fs;

  render: (template: string, params: { [key: string]: unknown }) => Promise<string>;
}

export interface AppsembleContext<P = unknown> {
  /**
   * The parsed command line parameters.
   */
  argv: Argv;

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
