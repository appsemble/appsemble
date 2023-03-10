import { AppsembleError, basicAuth } from '@appsemble/node-utils';
import { Remapper, TokenResponse, UserEmail, UserInfo } from '@appsemble/types';
import { remap } from '@appsemble/utils';
import axios from 'axios';
import jwt from 'jsonwebtoken';

/**
 * Check if all required scopes are granted.
 *
 * @param grantedScopes The scopes that have been granted to the client.
 * @param requiredScopes The scopes that are required to perform an operation.
 * @returns If the client is allowed to perform the operation based on the scopes.
 */
export function hasScope(grantedScopes: string, requiredScopes: string): boolean {
  const granted = grantedScopes.split(' ');
  const required = requiredScopes.split(' ');
  return required.every((scope) => granted.includes(scope));
}

/**
 * Fetch an access token as part of the authorization code OAuth2 flow.
 *
 * @param tokenUrl The URL from which to request the access token.
 * @param code The authorization code to exchange for an access token.
 * @param redirectUri The redirect URI used to get the authorization code.
 * @param clientId The OAuth2 client id.
 * @param clientSecret The OAuth2 client secret.
 * @returns The data from an access token response.
 */
export async function getAccessToken(
  tokenUrl: string,
  code: string,
  redirectUri: string,
  clientId: string,
  clientSecret: string,
): Promise<TokenResponse> {
  // Exchange the authorization code for an access token and refresh token.
  const { data } = await axios.post<TokenResponse>(
    tokenUrl,
    new URLSearchParams({
      grant_type: 'authorization_code',
      // Some providers only support client credentials in the request body,
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
    {
      headers: {
        // Explicitly request JSON. Otherwise, some services, e.g. GitHub, give a bad response.
        accept: 'application/json',
        // Some providers only support basic auth,
        authorization: basicAuth(clientId, clientSecret),
      },
    },
  );
  return data;
}

/**
 * Get user info given an OAuth2 provider preset and a token response.
 *
 * 1. If an ID token is present, try to extract information from it.
 * 2. If the information is still  lacking, extract information from the access token.
 * 3. If the information is still lacking, fetch information from the userinfo endpoint.
 *
 * @param accessToken The access token from which to extract user data. or to request user info
 * with.
 * @param idToken The ID token from which to extract user data.
 * @param userInfoUrl The URL from which to request userinfo, if needed.
 * @param remapper An optional remapper to apply onto the response from the user info endpoint.
 * @param userEmailsUrl The URL from which to request user emails, if needed.
 * @returns A user info object constructed from the access token, id token, and userinfo endpoint.
 */
export async function getUserInfo(
  accessToken: string,
  idToken?: string,
  userInfoUrl?: string,
  remapper?: Remapper,
  userEmailsUrl?: string,
): Promise<Partial<UserInfo>> {
  let email: string;
  let emailVerified: boolean;
  let name: string;
  let profile: string;
  let picture: string;
  let sub: string;
  let locale: string;
  let zoneinfo: string;

  function assign(info: UserInfo): void {
    email ??= info.email;
    emailVerified ??= info.email_verified;
    name ??= info.name;
    profile ??= info.profile;
    picture ??= info.picture;
    locale ??= info.locale;
    zoneinfo ??= info.zoneinfo;
    // The returned subject may be a number for non OpenID compliant services, e.g. GitHub.
    sub ??= typeof info.sub === 'number' ? String(info.sub) : info.sub;
  }

  function shouldTryNext(): boolean {
    return !name || !email || !profile || !picture || !sub;
  }

  if (idToken) {
    try {
      assign(jwt.decode(idToken) as UserInfo);
    } catch {
      // No ID token was provided, or it was invalid.
      // Fall back to using the access token instead.
    }
  }

  if (shouldTryNext()) {
    try {
      assign(jwt.decode(accessToken) as UserInfo);
    } catch {
      // No ID token was provided, or it was invalid.
      // Fall back to requesting user info instead.
    }
  }

  if (shouldTryNext() && userInfoUrl) {
    const requestConfig = {
      headers: { authorization: `Bearer ${accessToken}` },
    };
    const { data } = await axios.get<UserInfo>(userInfoUrl, requestConfig);
    const actualData: UserInfo = remapper
      ? (remap(remapper, data, null) as UserInfo)
      : (data as UserInfo);
    if (!actualData.email && userEmailsUrl) {
      const { data: emailsData } = await axios.get<UserEmail[]>(userEmailsUrl, requestConfig);
      if (emailsData.length > 0) {
        actualData.email = emailsData[0].email;
      }
    }
    assign(actualData);
  }

  // Sub is very important. All other information is optional.
  if (!sub) {
    throw new AppsembleError('No subject could be found while logging in using OAuth2');
  }

  return {
    email,
    email_verified: Boolean(emailVerified),
    name,
    picture,
    profile,
    sub,
    locale,
    zoneinfo,
  };
}
