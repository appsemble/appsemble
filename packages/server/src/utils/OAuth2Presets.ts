import type { IconName } from '@fortawesome/fontawesome-common-types';

export interface OAuth2Preset {
  /**
   * The URL to which the user should be redirected in order to login.
   */
  authorizationUrl: string;

  /**
   * The Font Awesome icon that will be rendered on the login button.
   */
  icon: IconName;

  /**
   * The name that will be rendered as the button label.
   */
  name: string;

  /**
   * The scopes to request as a space separated string.
   */
  scope: string;

  /**
   * The URL from which access tokens are requested.
   */
  tokenUrl: string;

  /**
   * The URL from which user information can be retrieved following the OpenID Connect standard.
   */
  userInfoUrl?: string;
}

/**
 * An OAuth2 preset for loggin in with GitLab.
 */
export const gitlabPreset: OAuth2Preset = {
  authorizationUrl: 'https://gitlab.com/oauth/authorize',
  icon: 'gitlab',
  name: 'GitLab',
  scope: 'email openid profile',
  tokenUrl: 'https://gitlab.com/oauth/token',
  userInfoUrl: 'https://gitlab.com/oauth/userinfo',
};

/**
 * An OAuth2 preset for loggin in with Google.
 */
export const googlePreset: OAuth2Preset = {
  authorizationUrl: 'https://accounts.google.com/o/oauth2/auth',
  icon: 'google',
  name: 'Google',
  scope: 'email openid profile',
  tokenUrl: 'https://accounts.google.com/o/oauth2/token',
  userInfoUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
};

export const presets = [gitlabPreset, googlePreset];
