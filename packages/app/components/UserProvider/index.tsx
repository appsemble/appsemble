import { Loader } from '@appsemble/react-components';
import { type AppMember, type TeamMember, type UserInfo } from '@appsemble/types';
import { setUser } from '@sentry/browser';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import {
  createContext,
  type Dispatch,
  type MutableRefObject,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { type UpdateTeam } from '../../types.js';
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
  role: null,
  teams: [],
};

interface PasswordLoginParams {
  username: string;
  password: string;
}

interface AuthorizationCodeLoginParams {
  code: string;
  redirect_uri: string;
}

interface LoginState {
  isLoggedIn: boolean;
  role: string;
  teams: TeamMember[];
}

interface UserContext extends LoginState {
  passwordLogin: (params: PasswordLoginParams) => Promise<void>;
  demoLogin: (role: string) => Promise<void>;
  authorizationCodeLogin: (params: AuthorizationCodeLoginParams) => Promise<void>;
  logout: () => any;
  updateTeam: UpdateTeam;
  userInfo: UserInfo;
  userInfoRef: MutableRefObject<UserInfo>;
  setUserInfo: Dispatch<UserInfo>;
}

interface UserProviderProps {
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

const Context = createContext<UserContext>(null);

export function UserProvider({ children }: UserProviderProps): ReactNode {
  const { definition } = useAppDefinition();
  // If there is no security definition, don’t even bother going into the loading state.
  const [isLoading, setIsLoading] = useState(Boolean(definition.security));
  const [state, setState] = useState(initialState);
  const [userInfo, setUserInfo] = useState<UserInfo>(null);
  const [exp, setExp] = useState(null);
  const [authorization, setAuthorization] = useState<string>(null);

  const userInfoRef = useRef(userInfo);
  userInfoRef.current = userInfo;

  /**
   * Reset everything to its initial state for a logged out user.
   */
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(REFRESH_TOKEN);
    setExp(null);
    setState(initialState);
    setUserInfo(null);
    setAuthorization(null);
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
      `${apiUrl}/oauth2/token`,
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
   * Fetch an access token, the user info, and member role, or log out if any step fails.
   *
   * @param grantType The grant type to authenticate with
   * @param params Additional parameters, which depend on the grant type.
   */
  const login = useCallback(
    async <P extends {}>(grantType: string, params: P) => {
      try {
        const [auth, { sub }] = await fetchToken(grantType, params);
        const config = { headers: { authorization: auth } };
        const [{ data: user }, role, { data: teams }] = await Promise.all([
          axios.get<UserInfo>(`${apiUrl}/api/connect/userinfo`, config),
          axios.get<AppMember>(`${apiUrl}/api/apps/${appId}/members/${sub}`, config).then(
            ({ data }) => data.role,
            (error) => {
              const { policy = 'everyone', role: defaultRole } = definition.security.default;
              if (
                policy === 'everyone' ||
                (policy === 'organization' &&
                  // XXX Make it so we don’t rely on the error message.
                  error.data.message === 'User is not a member of the organization.')
              ) {
                return defaultRole;
              }
              throw error;
            },
          ),
          axios.get<TeamMember[]>(`${apiUrl}/api/apps/${appId}/teams`, config),
        ]);

        setUser({ id: user.sub });
        setUserInfo(user);
        setState({
          isLoggedIn: true,
          role,
          teams,
        });
      } catch (error: unknown) {
        logout();
        throw error;
      }
    },
    [definition, fetchToken, logout],
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
   * @param role The role to log in as.
   */
  const demoLogin = useCallback(
    (role: string) => {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN);
      return login('urn:ietf:params:oauth:grant-type:demo-login', {
        role,
        ...(refreshToken ? { refresh_token: refreshToken } : {}),
      });
    },
    [login],
  );

  const updateTeam: UpdateTeam = useCallback((team) => {
    setState(({ teams, ...oldState }) => {
      const newTeams = teams.map((t) => (t.id === team.id ? { ...t, role: team.role } : t));
      if (!newTeams.some((t) => t.id === team.id)) {
        newTeams.push(team);
      }
      return {
        ...oldState,
        teams: newTeams,
      };
    });
  }, []);

  // Initialize the login session/
  useEffect(() => {
    // If the app doesn’t have a security definition, don’t even bother initializing anything.
    if (!definition.security) {
      return;
    }

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
  }, [definition, developmentLogin, login, logout]);

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
      updateTeam,
      setUserInfo,
      userInfo,
      userInfoRef,
      ...state,
    }),
    [
      authorizationCodeLogin,
      passwordLogin,
      developmentLogin,
      demoLogin,
      logout,
      updateTeam,
      userInfo,
      state,
    ],
  );

  // If security hasn’t been initialized yet, show a loader instead of the children. This prevents
  // children from crashing when the context is still undefined.
  if (isLoading) {
    return <Loader />;
  }

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useUser(): UserContext {
  return useContext(Context);
}
