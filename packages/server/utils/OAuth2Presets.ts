import { type Remapper } from '@appsemble/lang-sdk';
import { type IconName } from '@fortawesome/fontawesome-common-types';

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

  /**
   * In case an OAuth2 provider doesn’t support a userinfo endpoint, this remapper may be used to
   * convert an alternative user information format to a userinfo object.
   */
  remapper?: Remapper;

  /**
   * The URL from which user emails can be retrieved.
   */
  userEmailsUrl?: string;
}

/**
 * An OAuth2 preset for login in with GitHub.
 */
export const githubPreset: OAuth2Preset = {
  authorizationUrl: 'https://github.com/login/oauth/authorize',
  icon: 'github',
  name: 'GitHub',
  scope: 'read:user user:email',
  tokenUrl: 'https://github.com/login/oauth/access_token',
  userInfoUrl: 'https://api.github.com/user',
  remapper: {
    'object.from': {
      email: { prop: 'email' },
      name: { prop: 'name' },
      profile: { prop: 'html_url' },
      picture: { prop: 'avatar_url' },
      sub: { prop: 'id' },
    },
  },
  userEmailsUrl: 'https://api.github.com/user/emails',
};

/**
 * An OAuth2 preset for login in with GitLab.
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
 * An OAuth2 preset for login in with Google.
 */
export const googlePreset: OAuth2Preset = {
  authorizationUrl: 'https://accounts.google.com/o/oauth2/auth',
  icon: 'google',
  name: 'Google',
  scope: 'email openid profile',
  tokenUrl: 'https://accounts.google.com/o/oauth2/token',
  userInfoUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
};

export const presets = [githubPreset, gitlabPreset, googlePreset];
