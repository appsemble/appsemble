import { Loader } from '@appsemble/react-components';
import { JwtPayload, Organization, TokenResponse, UserInfo } from '@appsemble/types';
import { setUser } from '@sentry/browser';
import axios, { AxiosHeaders } from 'axios';
import jwtDecode from 'jwt-decode';
import {
  createContext,
  Dispatch,
  ReactElement,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { Role } from '../../types.js';

interface UserProviderProps {
  children: ReactNode;
}

/**
 * The representation of an organization that the user is a member of.
 */
export interface UserOrganization extends Organization {
  /**
   * The user’s role within the organization.
   */
  role: Role;
}

interface UserContext {
  login: (tokenResponse: TokenResponse) => void;
  logout: () => void;
  userInfo: UserInfo;
  refreshUserInfo: () => Promise<void>;
  organizations: UserOrganization[];
  setOrganizations: Dispatch<SetStateAction<UserOrganization[]>>;
}

const Context = createContext<UserContext>(null);

// The buffer between the access token expiration and the refresh token request. A minute should be
// plenty of time for the refresh token request to finish.
const REFRESH_BUFFER = 60e3;

export function UserProvider({ children }: UserProviderProps): ReactElement {
  const [userInfo, setUserInfo] = useState<UserInfo>();
  const [organizations, setOrganizations] = useState<UserOrganization[]>();
  const [initialized, setInitialized] = useState(false);
  const [tokenResponse, setTokenResponse] = useState<Partial<TokenResponse>>({
    access_token: localStorage.access_token,
    refresh_token: localStorage.refresh_token,
  });
  const [accessToken, setAccessToken] = useState(localStorage.access_token);

  const refreshUserInfo = useCallback(async () => {
    const { data } = await axios.get<UserInfo>('/api/connect/userinfo');
    setUser({ id: data.sub });
    setUserInfo(data);
  }, []);

  const login = useCallback((response: TokenResponse) => {
    localStorage.access_token = response.access_token;
    localStorage.refresh_token = response.refresh_token;
    setAccessToken(response.access_token);
    setTokenResponse(response);
  }, []);

  const fetchOrganizations = useCallback(async () => {
    const { data } = await axios.get<UserOrganization[]>('/api/user/organizations');
    setOrganizations(data);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setUserInfo(null);
    setOrganizations([]);
    setAccessToken(null);
    delete localStorage.access_token;
    delete localStorage.refresh_token;
  }, []);

  const value = useMemo(
    () => ({
      login,
      logout,
      userInfo,
      refreshUserInfo,
      organizations,
      setOrganizations,
    }),
    [login, logout, userInfo, refreshUserInfo, organizations],
  );

  useEffect(() => {
    if (accessToken) {
      const interceptor = axios.interceptors.request.use((config) => {
        // Only add the authorization headers for internal requests.
        if (config.url.startsWith('/')) {
          (config.headers as AxiosHeaders).set('authorization', `Bearer ${accessToken}`);
        }
        return config;
      });

      return () => {
        axios.interceptors.request.eject(interceptor);
      };
    }
  }, [accessToken]);

  useEffect(() => {
    if (!tokenResponse.access_token || !tokenResponse.refresh_token) {
      logout();
      setInitialized(true);
      return;
    }

    setAccessToken(tokenResponse.access_token);

    const { exp } = jwtDecode<JwtPayload>(tokenResponse.access_token);
    const timeout = exp * 1e3 - REFRESH_BUFFER - Date.now();
    const timeoutId = setTimeout(async () => {
      try {
        const { data } = await axios.post<TokenResponse>('/api/refresh', {
          refresh_token: tokenResponse.refresh_token,
        });
        login(data);
      } catch {
        logout();
      }
    }, timeout);

    Promise.all([refreshUserInfo(), fetchOrganizations()]).finally(() => {
      setInitialized(true);
    });

    return () => {
      clearTimeout(timeoutId);
    };
  }, [fetchOrganizations, login, logout, tokenResponse, refreshUserInfo]);

  if (!initialized) {
    return <Loader />;
  }

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useUser(): UserContext {
  return useContext(Context);
}
