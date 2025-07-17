import { type AppRole } from '@appsemble/lang-sdk';
import { Loader } from '@appsemble/react-components';
import {
  type App,
  type JwtPayload,
  type Organization,
  type PredefinedOrganizationRole,
  type TokenResponse,
  type UserInfo,
} from '@appsemble/types';
import { setUser as setSentryUser } from '@sentry/browser';
import axios, { type AxiosHeaders } from 'axios';
import { jwtDecode } from 'jwt-decode';
import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

interface UserProviderProps {
  readonly children: ReactNode;
}

/**
 * The representation of an organization that the user is a member of.
 */
export interface UserOrganization extends Organization {
  /**
   * The user’s role within the organization.
   */
  role: PredefinedOrganizationRole;
}

/**
 * The representation of an app that the user is a member of.
 */
export interface UserApp extends App {
  /**
   * The user’s role within the organization.
   */
  role: AppRole;
}

interface UserContext {
  login: (tokenResponse: TokenResponse) => void;
  logout: () => void;
  userInfo: UserInfo;
  refreshUserInfo: () => Promise<void>;
  organizations: UserOrganization[];
  setOrganizations: Dispatch<SetStateAction<UserOrganization[]>>;
  setHasNoLoginMethods: Dispatch<SetStateAction<boolean>>;
  hasNoLoginMethods: boolean;
}

const Context = createContext<UserContext>(null);

// The buffer between the access token expiration and the refresh token request. A minute should be
// plenty of time for the refresh token request to finish.
const REFRESH_BUFFER = 60e3;

export function UserProvider({ children }: UserProviderProps): ReactNode {
  const [userInfo, setUserInfo] = useState<UserInfo>();
  const [organizations, setOrganizations] = useState<UserOrganization[]>();
  const [initialized, setInitialized] = useState(false);
  const [hasNoLoginMethods, setHasNoLoginMethods] = useState(false);

  const [tokenResponse, setTokenResponse] = useState<Partial<TokenResponse>>({
    access_token: localStorage.access_token,
    refresh_token: localStorage.refresh_token,
  });
  const accessTokenRef = useRef<string | null>(localStorage.access_token);

  const refreshUserInfo = useCallback(async () => {
    const { data } = await axios.get<UserInfo>('/api/users/current');
    setSentryUser({ id: data.sub });
    setUserInfo(data);
  }, []);

  const login = useCallback((response: TokenResponse) => {
    localStorage.access_token = response.access_token;
    localStorage.refresh_token = response.refresh_token;
    accessTokenRef.current = response.access_token;
    setTokenResponse(response);
  }, []);

  const fetchOrganizations = useCallback(async () => {
    const { data } = await axios.get<UserOrganization[]>('/api/users/current/organizations');
    setOrganizations(data);
  }, []);

  const logout = useCallback(() => {
    setSentryUser(null);
    setUserInfo(null);
    setOrganizations([]);
    accessTokenRef.current = null;
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
      hasNoLoginMethods,
      setHasNoLoginMethods,
      setOrganizations,
    }),
    [login, logout, userInfo, refreshUserInfo, organizations, hasNoLoginMethods],
  );

  useEffect(() => {
    const interceptor = axios.interceptors.request.use((config) => {
      // Only add the authorization headers for internal requests.
      if (config.url.startsWith('/') && accessTokenRef.current) {
        (config.headers as AxiosHeaders).set('authorization', `Bearer ${accessTokenRef.current}`);
      }
      return config;
    });
    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, []);

  useEffect(() => {
    if (!tokenResponse.access_token || !tokenResponse.refresh_token) {
      logout();
      setInitialized(true);
      return;
    }

    accessTokenRef.current = tokenResponse.access_token;

    const { exp } = jwtDecode<JwtPayload>(tokenResponse.access_token);
    const timeout = exp * 1e3 - REFRESH_BUFFER - Date.now();
    const refresh = async (): Promise<void> => {
      try {
        const { data } = await axios.post<TokenResponse>('/api/auth/refresh-token', {
          refresh_token: tokenResponse.refresh_token,
        });
        login(data);
      } catch {
        logout();
      }
    };
    const timeoutId = setTimeout(refresh, timeout);

    // If the access token is within 1 second of expiring (just to be safe),
    // refresh it before loading children.
    const waitForAccessToken = exp * 1e3 < Date.now() ? refresh : Promise.resolve.bind(Promise);
    waitForAccessToken()
      .then(() => Promise.all([refreshUserInfo(), fetchOrganizations()]))
      .finally(() => {
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
