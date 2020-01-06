import axios from 'axios';
import jwtDecode from 'jwt-decode';
import * as React from 'react';

import { UserContext } from '../../hooks/useUser';
import { TokenResponse, UserInfo } from '../../types';

interface JwtPayload {
  exp: number;
  scopes: string;
  sub: string;
}

interface UserProviderProps {
  children: React.ReactNode;
}

// The buffer between the access token expiration and the refresh token request. A minute should be
// plenty of time for the refresh token request to finish.
const REFRESH_BUFFER = 60e3;

export default function UserProvider({ children }: UserProviderProps): React.ReactElement {
  const [userInfo, setProfile] = React.useState<UserInfo>();
  const [tokenResponse, setTokenResponse] = React.useState<TokenResponse>({
    access_token: localStorage.access_token,
    refresh_token: localStorage.refresh_token,
  });

  const setToken = React.useCallback((response: TokenResponse) => {
    axios.defaults.headers.authorization = `Bearer ${response.access_token}`;
    localStorage.access_token = response.access_token;
    localStorage.refresh_token = response.refresh_token;
    setTokenResponse(response);
  }, []);

  const refreshUserInfo = React.useCallback(async () => {
    const { data } = await axios.get<UserInfo>('/api/connect/userinfo');
    setProfile(data);
  }, []);

  const login = React.useCallback(
    (response: TokenResponse) => {
      setToken(response);
      refreshUserInfo();
    },
    [refreshUserInfo, setToken],
  );

  const logout = React.useCallback(() => {
    setProfile(null);
    delete axios.defaults.headers.authorization;
    delete localStorage.access_token;
    delete localStorage.refresh_token;
  }, []);

  const value = React.useMemo(
    () => ({
      login,
      logout,
      userInfo,
      refreshUserInfo,
    }),
    [login, logout, userInfo, refreshUserInfo],
  );

  React.useEffect(() => {
    if (!tokenResponse.access_token || !tokenResponse.refresh_token) {
      logout();
      return undefined;
    }

    axios.defaults.headers.authorization = `Bearer ${tokenResponse.access_token}`;

    const { exp } = jwtDecode<JwtPayload>(tokenResponse.access_token);
    const timeout = exp * 1e3 - REFRESH_BUFFER - new Date().getTime();
    const timeoutId = setTimeout(async () => {
      try {
        const { data } = await axios.post<TokenResponse>('/api/refresh', {
          refresh_token: tokenResponse.refresh_token,
        });
        setTokenResponse(data);
        refreshUserInfo();
      } catch (err) {
        logout();
      }
    }, timeout);
    refreshUserInfo();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [logout, refreshUserInfo, tokenResponse]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
