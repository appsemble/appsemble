import type { ParameterizedContext } from 'koa';
import type * as compose from 'koa-compose';
import type { URL as URL_, URLSearchParams as URLSearchParams_ } from 'url';

declare global {
  // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/34960
  // eslint-disable-next-line no-redeclare
  const URL: typeof URL_;
  // eslint-disable-next-line no-redeclare
  const URLSearchParams: typeof URLSearchParams_;
}

declare module 'sequelize' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Model {
    export function associate(): void;
  }
}

declare module 'koa' {
  interface Request {
    body: any;
  }
}

export interface Argv {
  appDomainStrategy?: string;
  disableRegistration?: boolean;
  host: string;
  ingressName?: string;
  ingressServiceName?: string;
  ingressServicePort?: string | number;
  kubernetesServiceHost?: string;
  kubernetesServicePort?: string | number;
  oauthGitlabKey?: string;
  oauthGoogleKey?: string;
  secret?: string;
  sentryDsn?: string;
}

export interface AppsembleState {
  render: (template: string, params: object) => Promise<string>;

  user: {
    id: number;
  };
}

export interface AppsembleContext<P extends {} = {}> {
  /**
   * The parsed command line parameters.
   */
  argv: Argv;

  /**
   * URL parameters either from Koas or tinyRouter.
   */
  params: P;
}

export type KoaContext<P extends {} = {}> = ParameterizedContext<
  AppsembleState,
  AppsembleContext<P>
>;

export type KoaMiddleware<P extends {} = {}> = compose.Middleware<KoaContext<P>>;
