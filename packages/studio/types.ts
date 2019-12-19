/**
 * OpenID Connect specifies a set of standard claims about the end-user, which cover common profile
 * information such as name, contact details, date of birth and locale.
 *
 * The Connect2id server can be set up to provide additional custom claims, such as roles and
 * permissions.
 */
export interface UserInfo {
  /**
   * The subject (end-user) identifier. This member is always present in a claims set.
   */
  sub: number;

  /**
   * The full name of the end-user, with optional language tag.
   */
  name: string;

  /**
   * The end-user's preferred email address.
   */
  email: string;

  /**
   * True if the end-user's email address has been verified, else false.
   */
  // eslint-disable-next-line camelcase
  email_verified: boolean;

  /**
   * The URL of the profile picture for the end-user.
   */
  picture: string;
}

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
    settings: {
      enableRegistration: boolean;
      logins: string[];
      sentryDsn: string;
    };
  }
}
