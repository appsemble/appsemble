import { OAuth2Provider, UserInfo } from '@appsemble/types';
import { TeamRole } from '@appsemble/utils';
import { OAuth2State } from '@appsemble/web-utils';

/**
 * A user email registration.
 */
export interface UserEmail {
  /**
   * The registered email address
   */
  email: string;

  /**
   * Wether or not the email address has been verified.
   */
  verified: boolean;
}

export interface OAuth2ClientCredentials {
  $created?: string;
  id: string;
  secret?: string;
  description: string;
  expires?: string;
  scopes: string[];
}

export type Role = 'AppEditor' | 'Maintainer' | 'Member' | 'Owner';

export interface Member {
  id: string;
  name?: string;
  primaryEmail?: string;
  role: Role;
}

export interface TeamMember {
  id: string;
  name?: string;
  primaryEmail?: string;
  role: TeamRole;
}

export interface Organization {
  id: string;
  name: string;
  role: Role;
  description: string;
  website: string;
  email: string;
  iconUrl: string;
}

/**
 * This extended state is stored in `sessionStorage` during the login process with OAuth2.
 */
export interface ExtendedOAuth2State extends OAuth2State {
  id: string;
  appRequest?: string;
  userinfo?: UserInfo;
}

declare module 'jsonschema' {
  interface Schema {
    /**
     * An optional default value that’s used.
     *
     * https://github.com/tdegrunt/jsonschema/pull/335
     */
    default?: any;
  }
}

declare global {
  interface Window {
    /**
     * This boolean indicates if Appsemble has loaded normally.
     *
     * If this is not been set, this means Appsemble didn’t load, probably because it doesn’t
     * recognize newer JavaScript features.
     */
    appsembleHasLoaded: boolean;

    settings: {
      enableRegistration: boolean;
      logins: OAuth2Provider[];
      sentryDsn: string;
      sentryEnvironment: string;
    };
  }
}
