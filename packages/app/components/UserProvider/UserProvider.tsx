import { AppMember, UserInfo } from '@appsemble/types';
import axios from 'axios';
import jwtDecode from 'jwt-decode';
import * as React from 'react';

import settings from '../../utils/settings';

interface UserContext {
  isLoggedIn: boolean;
  userInfo: UserInfo;
  role: string;
  login: (params: { username: string; password: string }) => any;
  logout: () => any;
}

interface JwtPayload {
  exp: number;
  scopes: string;
  sub: number;
  iss: string;
}

interface UserProviderProps {
  children: React.ReactElement;
}

/**
 * A successful OAuth2 token response.
 */
interface TokenResponse {
  /**
   * A bearer access token.
   */
  // eslint-disable-next-line camelcase
  access_token: string;

  /**
   * The refresh token.
   */
  // eslint-disable-next-line camelcase
  refresh_token: string;
}

const Context = React.createContext<UserContext>(null);

export default function UserProvider({ children }: UserProviderProps): React.ReactElement {
  const [isLoggedIn, setLoggedIn] = React.useState(false);
  const [accessToken, setAccessToken] = React.useState<string>(localStorage.access_token);
  const [payload, setPayload] = React.useState<JwtPayload>(null);
  const [refreshToken, setRefreshToken] = React.useState<string>(localStorage.refresh_token);
  const [userInfo, setUserInfo] = React.useState<UserInfo>(null);
  const [role, setRole] = React.useState<string>(null);

  const exp = payload?.exp;
  const sub = payload?.sub;

  /**
   * Fetch the user info object, so it can be rendered in the profile menu.
   */
  const fetchUserInfo = React.useCallback(async () => {
    const { data } = await axios.get<UserInfo>(`${settings.apiUrl}/api/connect/userinfo`);
    setUserInfo(data);
  }, []);

  /**
   * Fetch the role of the user within the app.
   */
  const fetchRole = React.useCallback(async () => {
    const { data } = await axios.get<AppMember>(
      `${settings.apiUrl}/api/apps/${settings.id}/members/${sub}`,
    );
    setRole(data.role);
  }, [sub]);

  /**
   * When the user logs out, reset the entire state.
   */
  const logout = React.useCallback(() => {
    setLoggedIn(false);
    setAccessToken(null);
    setRefreshToken(null);
    setPayload(null);
    setUserInfo(null);
    setRole(null);
    delete axios.defaults.headers.common.authentication;
    delete localStorage.access_token;
    delete localStorage.refresh_token;
  }, []);

  /**
   * Conveniently fetch an access token.
   *
   * @param grantType The grant type to authenticate with
   * @param params Additional parameters, which depend on the grant type.
   */
  const getToken = React.useCallback(
    async (grantType: string, params: Record<string, string>) => {
      try {
        const { data } = await axios.post<TokenResponse>(
          `${settings.apiUrl}/oauth2/token`,
          new URLSearchParams({
            client_id: `app:${settings.id}`,
            grant_type: grantType,
            scope: 'openid',
            ...params,
          }),
        );
        setAccessToken(data.access_token);
        setRefreshToken(data.refresh_token);
        setLoggedIn(true);
      } catch (error) {
        logout();
      }
    },
    [logout],
  );

  /**
   * Login using the password grant type.
   *
   * @param params a username and password.
   */
  const login = React.useCallback(params => getToken('password', params), [getToken]);

  /**
   * If an access token is set, configure axios, decode the payload, and store the token to local
   * storage.
   *
   * If no access token is defined, reset everything.
   */
  React.useEffect(() => {
    if (accessToken) {
      axios.defaults.headers.common.authorization = `Bearer ${accessToken}`;
      localStorage.access_token = accessToken;
      setPayload(jwtDecode(accessToken));
      setLoggedIn(true);
    } else {
      logout();
    }
  }, [accessToken, logout]);

  /**
   * If a refresh token is defined, store it into local storage. Otherwise, delete it.
   */
  React.useEffect(() => {
    if (!refreshToken) {
      delete localStorage.refresh_token;
      return undefined;
    }

    // A refresh token is defined, but not the JWT payload of the access token. Something weird is
    // going in. Log out to be sure.
    if (!exp) {
      return undefined;
    }

    // exp is in seconds
    // 300 seconds equals 5 minutes
    // (exp - 300) * 1000 equals the expiration minus 5 minutes in milliseconds
    // Date.now() returns the date in milliseconds
    // timeout is how many milliseconds until the refresh token is almost expired. At this point,
    // start a token refresh.
    const timeout = (exp - 300) * 1000 - Date.now();

    localStorage.refresh_token = refreshToken;
    const timeoutId = setTimeout(
      () => getToken('refresh_token', { refresh_token: refreshToken }),
      timeout,
    );
    return () => {
      clearTimeout(timeoutId);
    };
  }, [exp, getToken, logout, refreshToken]);

  /**
   * If the user is logged in, fetch the user info and app role. Otherwise, reset these.
   */
  React.useEffect(() => {
    if (isLoggedIn) {
      fetchUserInfo();
      fetchRole();
    } else {
      setUserInfo(null);
      setRole(null);
    }
  }, [fetchRole, fetchUserInfo, isLoggedIn]);

  const value = React.useMemo(() => ({ isLoggedIn, login, logout, role, userInfo }), [
    isLoggedIn,
    login,
    logout,
    role,
    userInfo,
  ]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useUser(): UserContext {
  return React.useContext(Context);
}
