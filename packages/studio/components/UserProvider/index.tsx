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
  roles: PredefinedOrganizationRole[];
  ssoRoles: PredefinedOrganizationRole[];
  guest: boolean;
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

  const storeTokens = useCallback((response: TokenResponse) => {
    localStorage.access_token = response.access_token;
    localStorage.refresh_token = response.refresh_token;
    accessTokenRef.current = response.access_token;
    setTokenResponse(response);
  }, []);

  const login = useCallback(
    (response: TokenResponse) => {
      setInitialized(false);
      storeTokens(response);
    },
    [storeTokens],
  );

  // The user info and organizations are published together, because pages behind a
  // `ProtectedRoute` render as soon as the user info is set and may depend on the organizations.
  const fetchUser = useCallback(async () => {
    const [{ data: user }, { data: userOrganizations }] = await Promise.all([
      axios.get<UserInfo>('/api/users/current'),
      axios.get<UserOrganization[]>('/api/users/current/organizations'),
    ]);
    setOrganizations(userOrganizations);
    setSentryUser({ id: user.sub });
    setUserInfo(user);
  }, []);

  const clearSession = useCallback(() => {
    setSentryUser(null);
    setUserInfo(null);
    setOrganizations([]);
    accessTokenRef.current = null;
  }, []);

  const logout = useCallback(() => {
    const accessToken = accessTokenRef.current;
    if (accessToken) {
      axios
        .post('/api/auth/logout', undefined, {
          headers: { authorization: `Bearer ${accessToken}` },
        })
        .catch(() => false);
    }
    clearSession();
    delete localStorage.access_token;
    delete localStorage.refresh_token;
    setTokenResponse((current) => (current.access_token || current.refresh_token ? {} : current));
  }, [clearSession]);

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
    const synchronize = (event: StorageEvent): void => {
      if (
        event.storageArea !== localStorage ||
        (event.key !== 'access_token' && event.key !== 'refresh_token' && event.key != null)
      ) {
        return;
      }
      const response = {
        access_token: localStorage.access_token,
        refresh_token: localStorage.refresh_token,
      };
      accessTokenRef.current = response.access_token;
      setTokenResponse((current) =>
        current.access_token === response.access_token &&
        current.refresh_token === response.refresh_token
          ? current
          : response,
      );
    };
    window.addEventListener('storage', synchronize);
    return () => window.removeEventListener('storage', synchronize);
  }, []);

  useEffect(() => {
    const interceptor = axios.interceptors.request.use((config) => {
      // Only add the authorization headers for internal requests.
      if (
        config.url.startsWith('/') &&
        accessTokenRef.current &&
        !config.headers.has('authorization')
      ) {
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
      // The tokens mirror the shared storage, where another tab may be halfway through storing a
      // new pair, so only this tab signs out.
      clearSession();
      setInitialized(true);
      return;
    }

    accessTokenRef.current = tokenResponse.access_token;

    const { exp } = jwtDecode<JwtPayload>(tokenResponse.access_token);
    const timeout = exp * 1e3 - REFRESH_BUFFER - Date.now();
    const refresh = async (): Promise<void> => {
      const refreshStoredTokens = async (): Promise<void> => {
        const accessToken = localStorage.access_token;
        const refreshToken = localStorage.refresh_token;
        if (!accessToken || !refreshToken) {
          logout();
          return;
        }
        const payload = jwtDecode<JwtPayload>(accessToken);
        if (payload.exp * 1e3 - REFRESH_BUFFER > Date.now()) {
          accessTokenRef.current = accessToken;
          setTokenResponse({ access_token: accessToken, refresh_token: refreshToken });
          return;
        }
        try {
          const { data } = await axios.post<TokenResponse>('/api/auth/refresh-token', {
            refresh_token: refreshToken,
          });
          if (localStorage.refresh_token === refreshToken) {
            storeTokens(data);
          }
        } catch {
          if (localStorage.refresh_token === refreshToken) {
            logout();
          }
        }
      };
      // The Web Locks API is only available in secure contexts.
      await (navigator.locks
        ? navigator.locks.request('appsemble-studio-refresh', refreshStoredTokens)
        : refreshStoredTokens());
    };
    const timeoutId = setTimeout(refresh, timeout);

    // If the access token is within 1 second of expiring (just to be safe),
    // refresh it before loading children.
    const waitForAccessToken = exp * 1e3 < Date.now() ? refresh : Promise.resolve.bind(Promise);
    waitForAccessToken()
      .then(() => (accessTokenRef.current ? fetchUser() : undefined))
      .catch(logout)
      .finally(() => {
        setInitialized(true);
      });

    return () => {
      clearTimeout(timeoutId);
    };
  }, [clearSession, fetchUser, logout, storeTokens, tokenResponse]);

  if (!initialized) {
    return <Loader />;
  }

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useUser(): UserContext {
  return useContext(Context);
}
