import { type OAuth2Provider } from '@appsemble/types';

import { randomString } from './randomString.js';

/**
 * The key in `sessionStorage` where the current state is stored.
 */
export const storageKey = 'oauth2Connecting';

export interface OAuth2State {
  /**
   * The authorization URL for which the login is in process.
   */
  authorizationUrl: string;

  /**
   * Where to redirect the user to after they have logged in.
   *
   * This is a counterpart of the `redirect` query parameter. This exists because the OAuth2 flow
   * removes any query parameters on the callback.
   *
   * > **Note**: Not to be confused with the OAuth2 `redirect_uri`.
   */
  redirect: string;

  /**
   * The state that was generated in the login process.
   */
  state: string;
}

/**
 * The options required to initiate a login using the authorization code grant type.
 */
export interface OAuth2LoginOptions
  extends Pick<OAuth2Provider, 'authorizationUrl' | 'clientId' | 'scope'> {
  /**
   * Where the user should be redirected upon approval. This may be a relative URL.
   */
  redirectUrl: string;

  redirect: string;
}

/**
 * Initiate the login process using OAuth2.
 *
 * @param options OAuth2 login options.
 * @param data Additional data to store in `sessionStorage`. This data will be available after the
 *   user has been redirected back.
 */
export function startOAuth2Login(
  { authorizationUrl, clientId, redirect, redirectUrl, scope }: OAuth2LoginOptions,
  data?: Record<string, unknown>,
): void {
  const url = new URL(authorizationUrl);
  const state = randomString();
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', String(new URL(redirectUrl, window.location.origin)));
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', scope);
  url.searchParams.set('state', state);
  sessionStorage.setItem(
    storageKey,
    JSON.stringify({ ...data, state, redirect, authorizationUrl } as OAuth2State),
  );

  window.location.href = String(url);
}

/**
 * Load the state as it is stored in `sessionStorage`.
 *
 * @returns The OAuth2 state as it is stored in `sessionStorage`.
 */
export function loadOAuth2State<T extends OAuth2State = OAuth2State>(): T {
  try {
    return JSON.parse(sessionStorage.getItem(storageKey) ?? '');
  } catch {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore 2322 null is not assignable to type (strictNullChecks)
    return null;
  }
}

/**
 * Append additional data in the oauth2 state in `sessionStorage`.
 *
 * @param extras The extra data to store.
 */
export function appendOAuth2State(extras: Record<string, unknown>): void {
  const session = loadOAuth2State();
  if (session) {
    sessionStorage.setItem(storageKey, JSON.stringify({ ...extras, ...session }));
  }
}

/**
 * Clear the login state from `sessionStorage`.
 */
export function clearOAuth2State(): void {
  sessionStorage.removeItem(storageKey);
}
