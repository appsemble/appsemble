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

/**
 * A response for a login token request
 */
export interface TokenResponse {
  /**
   * The bearer access token to use for authenticating requests.
   */
  // eslint-disable-next-line camelcase
  access_token: string;

  /**
   * A refresh token for getting a new access token.
   */
  // eslint-disable-next-line camelcase
  refresh_token: string;
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
  id: number;
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
      logins: string[];
      sentryDsn: string;
    };
  }
}
