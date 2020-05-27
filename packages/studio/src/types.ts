import type { IconName } from '@fortawesome/fontawesome-common-types';

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

/**
 * A representation of an OAuth2 provider in studio.
 *
 * This interface holds the properties needed to render a redirect button on the login or profile
 * screen.
 */
export interface OAuth2Provider {
  /**
   * The OAuth2 redirect URL.
   *
   * The user will be redirected here. On this page the user will have to grant access to Appsemble
   * to log them in.
   */
  authorizationUrl: string;

  /**
   * The public client id which identifies Appsemble to the authorization server.
   */
  clientId: string;

  /**
   * A Font Awesome icon which represents the OAuth2 provider.
   */
  icon: IconName;

  /**
   * A display name which represents the OAuth2 provider.
   *
   * I.e. `Facebook`, `GitLab`, or `Google`.
   */
  name: string;

  /**
   * The login scope that will be requested from the authorization server.
   */
  scope: string;
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
