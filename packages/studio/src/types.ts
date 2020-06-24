import type { OAuth2Provider } from '@appsemble/types';

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

export type Role = 'Owner' | 'Maintainer' | 'AppEditor' | 'Member';

export interface Member {
  id: string;
  name?: string;
  primaryEmail?: string;
  role: Role;
}

export interface Organization {
  id: string;
  name: string;
  role: Role;
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
    };
  }
}

export interface NamedEventTarget {
  name?: string;
}

export interface NamedEvent<T extends NamedEventTarget = NamedEventTarget> {
  target: T;
}
