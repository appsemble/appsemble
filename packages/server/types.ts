import { type App, type User } from './models/index.js';
import { type Mailer } from './utils/email/Mailer.js';

declare module 'koa' {
  interface Request {
    body: any;
  }

  interface DefaultContext {
    mailer: Mailer;

    /**
     * URL parameters from tinyRouter.
     */
    params?: Record<string, string>;
  }
}

declare module 'koas-security' {
  interface Clients {
    app: { scope: string; app: App };
    basic: {};
    cli: { scope: string };
    studio: {};
  }

  interface Users {
    app: User;
    basic: User;
    cli: User;
    studio: User;
  }
}

declare module 'koas-parameters' {
  interface PathParams {
    appId: number;
    appOAuth2SecretId: number;
    appSamlSecretId: number;
    assetId: string;
    blockId: string;
    blockVersion: string;
    clientId: string;
    language: string;
    memberId: string;
    organizationId: string;
    path: string;
    resourceId: number;
    resourceType: string;
    screenshotId: number;
    snapshotId: number;
    teamId: string;
    token: string;
    appServiceId: number;
  }

  interface QueryParams {
    domains: string[];
    $filter?: string;
    $orderby?: string;
    $select: string;
    $top: number;
    $skip: number;
    code: string;
    view: string;
  }
}
