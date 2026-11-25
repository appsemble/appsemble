import { type AppRole, getRouteSegment } from '@appsemble/lang-sdk';
import { type AppMemberGroup, type AppMemberInfo } from '@appsemble/types';
import { setUser as setSentryUser } from '@sentry/browser';
import axios, { type InternalAxiosRequestConfig } from 'axios';
import { jwtDecode } from 'jwt-decode';
import { type ComponentChildren, createContext, type VNode } from 'preact';
import { type MutableRefObject } from 'preact/compat';
import {
  type Dispatch,
  type StateUpdater,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'preact/hooks';
import { useLocation, useParams } from 'wouter-preact';

import { Loader } from '../Loader/index.js';
import { clearAccountLinkingState, loadAccountLinkingState } from '../../utils/accountLinking.js';
import { oauth2Scope } from '../../utils/constants.js';
import { ActionOwnerAbortError } from '../../utils/makeActions.js';
import { apiUrl, appId } from '../../utils/settings.js';
import { getGrantTotpChallenge } from '../../utils/totp.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { useAppMessages } from '../AppMessagesProvider/index.js';

interface JwtPayload {
  exp: number;
  iat: number;
  scopes: string;
  sub: string;
  iss: string;
}

const initialState: LoginState = {
  isLoggedIn: false,
  appMemberRoles: [],
  appMemberGroups: [],
  totpPending: null,
};
const apiOrigin = new URL(apiUrl).origin;

function isApiRequest(config: InternalAxiosRequestConfig): boolean {
  try {
    return new URL(axios.getUri(config)).origin === apiOrigin;
  } catch {
    return false;
  }
}

// The session cookies belong to the Appsemble API. Other origins may reject credentialed requests,
// for example when they allow any origin.
axios.interceptors.request.use((config) =>
  isApiRequest(config) ? { ...config, withCredentials: true } : config,
);

interface PasswordLoginParams {
  username: string;
  password: string;
  redirect?: string;
}

interface AuthorizationCodeLoginParams {
  code: string;
  redirect_uri: string;

  /**
   * The app page the OAuth2 login was started from, if any.
   */
  redirect?: string;
}

interface DemoLoginParams {
  appMemberId?: string;
  appRole?: string;
}

interface TotpPendingState {
  /**
   * When the pending TOTP token expires, in milliseconds since the epoch.
   */
  expires: number;
  redirect?: string;

  /**
   * The auth request this TOTP step belongs to. Once a newer request replaces it, such as a logout
   * or another login, the step may no longer result in a session.
   */
  requestId: number;

  /**
   * Settle the login waiting for this TOTP step. Only the first call has an effect.
   */
  settle: (completed: boolean) => void;
  totpEnabled: boolean;

  /**
   * The pending TOTP token proving the first authentication factor has been verified.
   */
  totpToken: string;
}

interface LoginState {
  isLoggedIn: boolean;
  appMemberRoles: AppRole[];
  appMemberGroups: AppMemberGroup[];
  totpPending: TotpPendingState | null;
}

interface AppMemberContext extends LoginState {
  passwordLogin: (params: PasswordLoginParams) => Promise<void>;
  authorizationCodeLogin: (params: AuthorizationCodeLoginParams) => Promise<void>;
  demoLogin: (props: DemoLoginParams) => Promise<void>;
  totpLogin: (token: string) => Promise<void>;
  completeTotpLogin: (tokens: TokenResponse) => Promise<void>;
  cancelTotpLogin: () => void;
  logout: () => Promise<void>;
  appMemberInfo: AppMemberInfo;
  appMemberInfoRef: MutableRefObject<AppMemberInfo>;
  setAppMemberInfo: Dispatch<AppMemberInfo>;
  addAppMemberGroup: (group: AppMemberGroup) => void;
  appMemberSelectedGroup: AppMemberGroup;
  setAppMemberSelectedGroup: Dispatch<StateUpdater<AppMemberGroup>>;
}

interface AppMemberProviderProps {
  readonly children: ComponentChildren;
}

/**
 * A successful OAuth2 token response.
 */
interface TokenResponse {
  /**
   * A bearer access token.
   */
  access_token: string;

  /**
   * A refresh token for renewing the current app member session.
   */
  refresh_token?: string;
}

// @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
const Context = createContext<AppMemberContext>(null);

export function AppMemberProvider({ children }: AppMemberProviderProps): VNode {
  const { definition } = useAppDefinition();
  // If there is no security definition, don’t even bother going into the loading state.
  const [isLoading, setIsLoading] = useState(Boolean(definition.security));
  const [state, setState] = useState(initialState);

  const [pathname, navigate] = useLocation();
  const isOAuth2Callback = /(^|\/)Callback$/.test(pathname);
  const { lang } = useParams<{ lang: string }>();
  const { getAppMessage } = useAppMessages();

  // @ts-expect-error 2345 argument of type is not assignable to parameter of type
  // (strictNullChecks)
  const [appMemberInfo, setAppMemberInfo] = useState<AppMemberInfo>(null);
  const [appMemberSelectedGroup, setAppMemberSelectedGroup] = useState<AppMemberGroup>(
    // @ts-expect-error 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    JSON.parse(sessionStorage.getItem(`appsemble-group-${appId}-appMemberSelectedGroup`)),
  );

  const [exp, setExp] = useState(null);
  const [authorization, setAuthorization] = useState<string | null>(null);

  const appMemberInfoRef = useRef(appMemberInfo);
  const authRequestRef = useRef(0);
  const refreshTokenRef = useRef<string | undefined>(undefined);
  appMemberInfoRef.current = appMemberInfo;

  const invalidateAuthRequests = useCallback(() => {
    authRequestRef.current += 1;
    return authRequestRef.current;
  }, []);

  const isLatestAuthRequest = useCallback(
    (requestId: number) => authRequestRef.current === requestId,
    [],
  );

  /**
   * Reset everything to its initial state for a logged out user.
   */
  const resetSessionState = useCallback(() => {
    setSentryUser(null);
    setExp(null);
    setAuthorization(null);
    refreshTokenRef.current = undefined;
    setState(initialState);
    // @ts-expect-error 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    setAppMemberInfo(null);
    // @ts-expect-error 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    setAppMemberSelectedGroup(null);
  }, []);

  /**
   * Revoke a session on the server and clear its cookies.
   *
   * @param refreshToken The refresh token of the session. By default the cookie determines it.
   */
  const revokeSession = useCallback(async (refreshToken?: string) => {
    try {
      await axios.post(
        `${apiUrl}/apps/${appId}/auth/oauth2/token`,
        new URLSearchParams({
          client_id: `app:${appId}`,
          grant_type: 'revoke_token',
          ...(refreshToken ? { refresh_token: refreshToken } : {}),
        }),
      );
    } catch {
      // Do nothing
    }
  }, []);

  /**
   * Clear the current app member session from both client state and server cookies.
   */
  const logout = useCallback(async () => {
    const refreshToken = refreshTokenRef.current;
    invalidateAuthRequests();
    resetSessionState();
    await revokeSession(refreshToken);
  }, [invalidateAuthRequests, resetSessionState, revokeSession]);

  const applyTokenExpiration = useCallback(
    (accessToken: string, requestId: number) => {
      if (!isLatestAuthRequest(requestId)) {
        return;
      }

      const payload = jwtDecode<JwtPayload>(accessToken);
      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks)
      setExp(payload.exp);
    },
    [isLatestAuthRequest],
  );

  const hydrateAuthenticatedState = useCallback(
    async (
      requestId: number,
      auth: string,
      { redirect, settle }: Partial<Pick<TotpPendingState, 'redirect' | 'settle'>>,
    ) => {
      const config = { headers: { authorization: auth } };
      const linking = loadAccountLinkingState();
      if (linking) {
        await axios.post(
          `${apiUrl}/api/apps/${appId}/members/current/link`,
          {
            externalId: linking.externalId,
            secret: linking.secret,
            email: linking.email,
          },
          config,
        );
      }

      if (!isLatestAuthRequest(requestId)) {
        return false;
      }

      const { data: appMember } = await axios.get<AppMemberInfo>(
        `${apiUrl}/api/apps/${appId}/members/current`,
        config,
      );

      if (!isLatestAuthRequest(requestId)) {
        return false;
      }

      let appMemberGroups: AppMemberGroup[] = [];
      try {
        const { data } = await axios.get<AppMemberGroup[]>(
          `${apiUrl}/api/apps/${appId}/members/current/groups`,
          config,
        );
        appMemberGroups = data;
      } catch {
        // Do nothing
      }

      if (!isLatestAuthRequest(requestId)) {
        return false;
      }

      setSentryUser({ id: appMember.sub });
      setAppMemberInfo(appMember);
      setState({
        isLoggedIn: true,
        appMemberRoles: appMember.roles ?? [],
        appMemberGroups,
        totpPending: null,
      });
      // The state update is queued first, so whatever waits for this login sees the session.
      settle?.(true);
      clearAccountLinkingState();

      if (redirect) {
        navigate(redirect);
      }
      return true;
    },
    [isLatestAuthRequest, navigate],
  );

  /**
   * Conveniently fetch an access token.
   *
   * @param grantType The grant type to authenticate with
   * @param params Additional parameters, which depend on the grant type.
   * @returns The authorization header for the session. If TOTP is required, this resolves once that
   *   step has settled, with whether it was completed. A request replaced by a newer one results in
   *   false.
   */
  const fetchToken = useCallback(
    async (grantType: string, params: Record<string, string>, requestId: number) => {
      let data: TokenResponse;
      try {
        ({ data } = await axios.post<TokenResponse>(
          `${apiUrl}/apps/${appId}/auth/oauth2/token`,
          new URLSearchParams({
            client_id: `app:${appId}`,
            grant_type: grantType,
            scope: oauth2Scope,
            ...params,
          }),
        ));
      } catch (error: unknown) {
        const challenge = getGrantTotpChallenge(error);
        if (!challenge) {
          throw error;
        }
        if (!isLatestAuthRequest(requestId)) {
          return false;
        }
        // The lifetime is added to the local time, because the clocks of the server and the client
        // may differ.
        const { exp: tokenExp, iat } = jwtDecode<JwtPayload>(challenge.totpToken);
        const expires = Date.now() + (tokenExp - iat) * 1000;
        return new Promise<boolean>((settle) => {
          // The credentials check out, but no session exists yet. The pending token is what proves
          // that first step to the TOTP endpoints. The redirect is carried along, so completing the
          // second factor still lands on the page the login was started from.
          setState((prev) => ({
            ...prev,
            totpPending: {
              expires,
              redirect: params.redirect,
              requestId,
              settle,
              totpEnabled: challenge.totpEnabled,
              totpToken: challenge.totpToken,
            },
          }));
        });
      }

      if (!isLatestAuthRequest(requestId)) {
        return false;
      }

      const { access_token: accessToken, refresh_token: refreshToken } = data;
      const auth = `Bearer ${accessToken}`;
      setAuthorization(auth);
      if (refreshToken) {
        refreshTokenRef.current = refreshToken;
      }
      applyTokenExpiration(accessToken, requestId);
      return auth;
    },
    [applyTokenExpiration, isLatestAuthRequest],
  );

  /**
   * Fetch an access token and the app member info or log out if any step fails.
   *
   * @param grantType The grant type to authenticate with
   * @param params Additional parameters, which depend on the grant type.
   * @returns Whether this login resulted in a session.
   */
  const login = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    async <P extends {}>(grantType: string, params: P) => {
      const requestId = invalidateAuthRequests();

      try {
        const auth = await fetchToken(grantType, params as Record<string, string>, requestId);

        return typeof auth === 'string'
          ? await hydrateAuthenticatedState(requestId, auth, params)
          : auth;
      } catch (error: unknown) {
        if (isLatestAuthRequest(requestId)) {
          await logout();
        }
        throw error;
      }
    },
    [fetchToken, hydrateAuthenticatedState, invalidateAuthRequests, isLatestAuthRequest, logout],
  );

  /**
   * Login using the discouraged password grant type.
   *
   * This resolves only once there is a session. A login which ends without one and without an error,
   * such as a cancelled TOTP step, stops the action chain it was started from.
   *
   * @param credentials The username and password.
   */
  const passwordLogin = useCallback(
    async (credentials: PasswordLoginParams) => {
      if (!(await login('password', credentials))) {
        throw new ActionOwnerAbortError();
      }
    },
    [login],
  );

  /**
   * Login using an OAuth2 authorization code.
   *
   * @param credentials The authorization code and redirect uri.
   */
  const authorizationCodeLogin = useCallback(
    async (credentials: AuthorizationCodeLoginParams) => {
      await login('authorization_code', credentials);
    },
    [login],
  );

  /**
   * Login using demo app functionality.
   *
   * @param appMemberId The app member to log in as.
   */
  const demoLogin = useCallback(
    async ({ appMemberId, appRole }: DemoLoginParams) => {
      await logout();
      await login('urn:ietf:params:oauth:grant-type:demo-login', {
        appMemberId,
        appRole,
      });
    },
    [login, logout],
  );

  /**
   * Complete login with TOTP verification.
   *
   * @param token The TOTP token from the authenticator app.
   */
  const completeTotpLogin = useCallback(
    async (data: TokenResponse) => {
      // The server already created a session for a step which ended while it was being verified.
      if (!state.totpPending || !isLatestAuthRequest(state.totpPending.requestId)) {
        await revokeSession(data.refresh_token);
        return;
      }

      const { requestId } = state.totpPending;
      refreshTokenRef.current = data.refresh_token;
      const auth = `Bearer ${data.access_token}`;
      setAuthorization(auth);
      applyTokenExpiration(data.access_token, requestId);
      await hydrateAuthenticatedState(requestId, auth, state.totpPending);
    },
    [
      applyTokenExpiration,
      hydrateAuthenticatedState,
      isLatestAuthRequest,
      revokeSession,
      state.totpPending,
    ],
  );

  const totpLogin = useCallback(
    async (token: string) => {
      if (!state.totpPending) {
        throw new Error('No TOTP verification pending');
      }

      const { data } = await axios.post<TokenResponse>(
        `${apiUrl}/api/apps/${appId}/auth/totp/verify`,
        {
          token,
          totpToken: state.totpPending.totpToken,
        },
      );

      await completeTotpLogin(data);
    },
    [completeTotpLogin, state.totpPending],
  );

  /**
   * Cancel pending TOTP verification and return to the login page.
   */
  const cancelTotpLogin = useCallback(() => {
    logout();
    const redirect =
      state.totpPending?.redirect ?? new URLSearchParams(window.location.search).get('redirect');
    navigate(
      `/${lang}/${getRouteSegment('Login', getAppMessage)}${
        redirect ? `?${new URLSearchParams({ redirect })}` : ''
      }`,
      { replace: true },
    );
  }, [getAppMessage, lang, logout, navigate, state.totpPending]);

  // However the TOTP step ends, the login waiting for it must not be left hanging.
  useEffect(() => () => state.totpPending?.settle(false), [state.totpPending]);

  useEffect(() => {
    if (!state.totpPending) {
      return;
    }
    const timeoutId = setTimeout(cancelTotpLogin, state.totpPending.expires - Date.now());
    return () => clearTimeout(timeoutId);
  }, [cancelTotpLogin, state.totpPending]);

  const addAppMemberGroup: (group: AppMemberGroup) => void = useCallback((group) => {
    setState(({ appMemberGroups, ...oldState }) => {
      const newGroups = [...appMemberGroups];

      if (!newGroups.some((g) => g.id === group.id)) {
        newGroups.push(group);
      }

      return {
        ...oldState,
        appMemberGroups: newGroups,
      };
    });
  }, []);

  // Initialize the login session.
  useEffect(() => {
    // If the app doesn’t have a security definition, don’t even bother initializing anything.
    if (!definition.security || !isLoading) {
      return;
    }

    if (isOAuth2Callback) {
      setIsLoading(false);
      return;
    }

    // Try to resume the session from the refresh token cookie.
    login('refresh_token', {})
      .catch(() => {
        // Do nothing. `login` already resets the local session state on failure.
      })
      .finally(() => setIsLoading(false));
  }, [definition, isLoading, isOAuth2Callback, login]);

  // Handle refreshing access tokens
  useEffect(() => {
    // Don’t start the refresh token loop until an access token expiration is known.
    if (exp == null) {
      return;
    }

    // `exp` is in seconds
    // 300 seconds equals 5 minutes
    // (exp - 300) * 1000 equals the expiration minus 5 minutes in milliseconds
    // Date.now() returns the date in milliseconds
    // timeout is how many milliseconds until the refresh token is almost expired. At this point,
    // start a token refresh.
    const timeout = (exp - 300) * 1000 - Date.now();

    const timeoutId = setTimeout(async () => {
      const requestId = invalidateAuthRequests();
      try {
        // Refresh the current session using the in-memory token if the browser rejected the cookie.
        await fetchToken(
          'refresh_token',
          refreshTokenRef.current ? { refresh_token: refreshTokenRef.current } : {},
          requestId,
        );
      } catch {
        // If refreshing the session fails for any reason, log out the user.
        logout();
      }
    }, timeout);
    return () => {
      // If a new timeout is registered, clear the old one.
      clearTimeout(timeoutId);
    };
  }, [exp, fetchToken, invalidateAuthRequests, logout]);

  useEffect(() => {
    if (!authorization) {
      return;
    }

    const interceptor = axios.interceptors.request.use((config) => {
      // Only assign the authorization header to requests made to the Appsemble API.
      if (isApiRequest(config)) {
        Object.assign(config.headers, { authorization });
      }
      return config;
    });
    return () => axios.interceptors.request.eject(interceptor);
  }, [authorization]);

  // The value is memoized to prevent unnecessary rerenders.
  const value = useMemo(
    () => ({
      authorizationCodeLogin,
      passwordLogin,
      demoLogin,
      totpLogin,
      completeTotpLogin,
      cancelTotpLogin,
      logout,
      addAppMemberGroup,
      setAppMemberInfo,
      appMemberInfo,
      appMemberInfoRef,
      appMemberSelectedGroup,
      setAppMemberSelectedGroup,
      ...state,
    }),
    [
      authorizationCodeLogin,
      passwordLogin,
      demoLogin,
      totpLogin,
      completeTotpLogin,
      cancelTotpLogin,
      logout,
      addAppMemberGroup,
      appMemberInfo,
      state,
      appMemberSelectedGroup,
      setAppMemberSelectedGroup,
    ],
  );

  // If security hasn’t been initialized yet, show a loader instead of the children. This prevents
  // children from crashing when the context is still undefined.
  if (isLoading) {
    return <Loader />;
  }

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useAppMember(): AppMemberContext {
  return useContext(Context);
}
