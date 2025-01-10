import { Loader } from '@appsemble/react-components';
import { type AppMemberGroup, type AppMemberInfo, type AppRole } from '@appsemble/types';
import { setUser as setSentryUser } from '@sentry/browser';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import {
  createContext,
  type Dispatch,
  type MutableRefObject,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';

import { clearAccountLinkingState, loadAccountLinkingState } from '../../utils/accountLinking.js';
import { oauth2Scope } from '../../utils/constants.js';
import { apiUrl, appId, development } from '../../utils/settings.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';

interface JwtPayload {
  exp: number;
  scopes: string;
  sub: string;
  iss: string;
}

const initialState: LoginState = {
  isLoggedIn: false,
  appMemberRole: null,
  appMemberGroups: [],
};

interface PasswordLoginParams {
  username: string;
  password: string;
  redirect?: string;
}

interface AuthorizationCodeLoginParams {
  code: string;
  redirect_uri: string;
}

interface DemoLoginParams {
  appMemberId?: string;
  appRole?: string;
}

interface LoginState {
  isLoggedIn: boolean;
  appMemberRole: AppRole;
  appMemberGroups: AppMemberGroup[];
}

interface AppMemberContext extends LoginState {
  passwordLogin: (params: PasswordLoginParams) => Promise<void>;
  authorizationCodeLogin: (params: AuthorizationCodeLoginParams) => Promise<void>;
  demoLogin: (props: DemoLoginParams) => Promise<void>;
  logout: () => any;
  appMemberInfo: AppMemberInfo;
  appMemberInfoRef: MutableRefObject<AppMemberInfo>;
  setAppMemberInfo: Dispatch<AppMemberInfo>;
  addAppMemberGroup: (group: AppMemberGroup) => void;
  appMemberSelectedGroup: AppMemberGroup;
  setAppMemberSelectedGroup: Dispatch<SetStateAction<AppMemberGroup>>;
}

interface AppMemberProviderProps {
  readonly children: ReactNode;
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
   * The refresh token.
   */
  refresh_token: string;
}

const REFRESH_TOKEN = 'refresh_token';

const Context = createContext<AppMemberContext>(null);

export function AppMemberProvider({ children }: AppMemberProviderProps): ReactNode {
  const { definition } = useAppDefinition();
  // If there is no security definition, don’t even bother going into the loading state.
  const [isLoading, setIsLoading] = useState(Boolean(definition.security));
  const [state, setState] = useState(initialState);

  const navigate = useNavigate();

  const [appMemberInfo, setAppMemberInfo] = useState<AppMemberInfo>(null);
  const [appMemberSelectedGroup, setAppMemberSelectedGroup] = useState<AppMemberGroup>(
    JSON.parse(sessionStorage.getItem(`appsemble-group-${appId}-appMemberSelectedGroup`)),
  );

  const [exp, setExp] = useState(null);
  const [authorization, setAuthorization] = useState<string>(null);

  const appMemberInfoRef = useRef(appMemberInfo);
  appMemberInfoRef.current = appMemberInfo;

  /**
   * Reset everything to its initial state for a logged out user.
   */
  const logout = useCallback(() => {
    setSentryUser(null);
    localStorage.removeItem(REFRESH_TOKEN);
    setExp(null);
    setState(initialState);
    setAppMemberInfo(null);
    setAuthorization(null);
    setAppMemberSelectedGroup(null);
  }, []);

  /**
   * Conveniently fetch an access token.
   *
   * @param grantType The grant type to authenticate with
   * @param params Additional parameters, which depend on the grant type.
   */
  const fetchToken = useCallback(async (grantType: string, params: Record<string, string>) => {
    if (development) {
      return ['', { sub: '1' }] as const;
    }

    const {
      data: { access_token: accessToken, refresh_token: rt },
    } = await axios.post<TokenResponse>(
      `${apiUrl}/apps/${appId}/auth/oauth2/token`,
      new URLSearchParams({
        client_id: `app:${appId}`,
        grant_type: grantType,
        scope: oauth2Scope,
        ...params,
      }),
    );
    const payload = jwtDecode<JwtPayload>(accessToken);
    localStorage.setItem(REFRESH_TOKEN, rt);
    const auth = `Bearer ${accessToken}`;
    setAuthorization(auth);
    setExp(payload.exp);
    return [auth, payload] as const;
  }, []);

  /**
   * Fetch an access token and the app member info or log out if any step fails.
   *
   * @param grantType The grant type to authenticate with
   * @param params Additional parameters, which depend on the grant type.
   */
  const login = useCallback(
    async <P extends {}>(grantType: string, params: P) => {
      try {
        const [auth] = await fetchToken(grantType, params);
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

        const { data: appMember } = await axios.get<AppMemberInfo>(
          `${apiUrl}/api/apps/${appId}/members/current`,
          config,
        );

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

        setSentryUser({ id: appMember.sub });
        setAppMemberInfo(appMember);
        setState({
          isLoggedIn: true,
          appMemberRole: appMember.role,
          appMemberGroups,
        });
        clearAccountLinkingState();

        if ((params as unknown as PasswordLoginParams).redirect) {
          navigate((params as unknown as PasswordLoginParams).redirect);
        }
      } catch (error: unknown) {
        logout();
        throw error;
      }
    },
    [fetchToken, logout, navigate],
  );

  /**
   * Login using the discouraged password grant type.
   *
   * @param credentials The username and password.
   */
  const passwordLogin = useCallback(
    (credentials: PasswordLoginParams) => login('password', credentials),
    [login],
  );

  /**
   * Login using an OAuth2 authorization code.
   *
   * @param credentials The authorization code and redirect uri.
   */
  const authorizationCodeLogin = useCallback(
    (credentials: AuthorizationCodeLoginParams) => login('authorization_code', credentials),
    [login],
  );

  /**
   * Login using the development server.
   *
   * @param credentials The username and password.
   */
  const developmentLogin = useCallback(() => login('development', {}), [login]);

  /**
   * Login using demo app functionality.
   *
   * @param appMemberId The app member to log in as.
   */
  const demoLogin = useCallback(
    ({ appMemberId, appRole }: DemoLoginParams) => {
      logout();
      const refreshToken = localStorage.getItem(REFRESH_TOKEN);
      return login('urn:ietf:params:oauth:grant-type:demo-login', {
        appMemberId,
        appRole,
        ...(refreshToken ? { refresh_token: refreshToken } : {}),
      });
    },
    [login, logout],
  );

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

  // Initialize the login session/
  useEffect(() => {
    // If the app doesn’t have a security definition, don’t even bother initializing anything.
    if (!definition.security) {
      return;
    }

    if (!appMemberInfo) {
      if (development) {
        developmentLogin();
      }
      const rt = localStorage.getItem(REFRESH_TOKEN);
      if (rt) {
        // If a refresh token is known, start a new session.
        login('refresh_token', { refresh_token: rt }).finally(() => setIsLoading(false));
      } else {
        // Otherwise make sure the state is fully reset.
        logout();
        setIsLoading(false);
      }
    }
  }, [appMemberInfo, definition, developmentLogin, login, logout]);

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
      const rt = localStorage.getItem(REFRESH_TOKEN);
      // If the refresh token was somehow removed from local storage, log out.
      if (!rt) {
        logout();
      }
      try {
        // Fetch a new access token, but do keep the original role and user info.
        await fetchToken('refresh_token', { refresh_token: rt });
      } catch {
        // If refreshing the session fails for any reason, log out the user.
        logout();
      }
    }, timeout);
    return () => {
      // If a new timeout is registered, clear the old one.
      clearTimeout(timeoutId);
    };
  }, [exp, fetchToken, logout]);

  useEffect(() => {
    if (!authorization) {
      return;
    }

    const interceptor = axios.interceptors.request.use((config) => {
      // Only assign the authorization header to requests made to the Appsemble API.
      if (new URL(axios.getUri(config)).origin === apiUrl) {
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
      developmentLogin,
      demoLogin,
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
      developmentLogin,
      demoLogin,
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
