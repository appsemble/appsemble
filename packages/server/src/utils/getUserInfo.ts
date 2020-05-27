import { AppsembleError } from '@appsemble/node-utils';
import type { TokenResponse, UserInfo } from '@appsemble/types';
import { remap } from '@appsemble/utils';
import axios from 'axios';
import { decode } from 'jsonwebtoken';

import type { OAuth2Preset } from './OAuth2Presets';

/**
 * Get user info given an OAuth2 provider preset and a token response.
 *
 * 1. If an ID token is present, try to extract information from it.
 * 2. If the information is still incomplete, extract information from the access token.
 * 3. If the information is still incomplete, fetch information from the userinfo endpoint.
 *
 * @param provider The provider which defines the userinfo endpoint.
 * @param response The response from which to extract user data.
 */
export default async function getUserInfo(
  provider: OAuth2Preset,
  response: TokenResponse,
): Promise<Partial<UserInfo>> {
  let email: string;
  let name: string;
  let profile: string;
  let picture: string;
  let sub: string;

  function assign(info: UserInfo): void {
    email = email ?? info.email;
    name = name ?? info.name;
    profile = profile ?? info.profile;
    picture = picture ?? info.picture;
    // The returned subject may be a number for non OpenID compliant services, e.g. GitHub.
    sub = sub ?? (typeof info.sub === 'number' ? String(info.sub) : info.sub);
  }

  function shouldTryNext(): boolean {
    return !name || !email || !profile || !picture || !sub;
  }

  if (response.id_token) {
    try {
      assign(decode(response.id_token) as UserInfo);
    } catch (err) {
      // No ID token was provided, or it was invalid.
      // Fall back to using the access token instead.
    }
  }

  if (shouldTryNext()) {
    try {
      assign(decode(response.access_token) as UserInfo);
    } catch (err) {
      // No ID token was provided, or it was invalid.
      // Fall back to requesting user info instead.
    }
  }

  if (shouldTryNext() && provider.userInfoUrl) {
    const { data } = await axios.get(provider.userInfoUrl, {
      headers: { authorization: `Bearer ${response.access_token}` },
    });
    assign(provider.remapper ? remap(provider.remapper, data) : data);
  }

  // Sub is very important. All other information is optional.
  if (!sub) {
    throw new AppsembleError('No subject could be found while logging in using OAuth2');
  }

  return { email, name, picture, profile, sub };
}
