import { Loader } from '@appsemble/react-components';
import { AppMember, UserInfo } from '@appsemble/types';
import axios from 'axios';
import jwtDecode from 'jwt-decode';
import * as React from 'react';

import settings from '../../utils/settings';
import { useAppDefinition } from '../AppDefinitionProvider';

interface JwtPayload {
  exp: number;
  scopes: string;
  sub: number;
  iss: string;
}

const initialState: LoginState = {
  isLoggedIn: false,
  role: null,
  userInfo: null,
};

interface PasswordLoginParams {
  username: string;
  password: string;
}

interface AuthorizationCodeLoginParams {
  code: string;
  // eslint-disable-next-line camelcase
  redirect_uri: string;
}

interface LoginState {
  isLoggedIn: boolean;
  role: string;
  userInfo: UserInfo;
}

interface UserContext extends LoginState {
  passwordLogin: (params: PasswordLoginParams) => Promise<void>;
  authorizationCodeLogin: (params: AuthorizationCodeLoginParams) => Promise<void>;
  logout: () => any;
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

const REFRESH_TOKEN = 'refresh_token';

const Context = React.createContext<UserContext>(null);

export default function UserProvider({ children }: UserProviderProps): React.ReactElement {
  const { definition } = useAppDefinition();
  // If there is no security definition, don’t even bother going into the loading state.
  const [isLoading, setLoading] = React.useState(!!definition.security);
  const [state, setState] = React.useState(initialState);
  const [exp, setExp] = React.useState(null);

  /**
   * Reset everything to its initial state for a logged out user.
   */
  const logout = React.useCallback(() => {
    localStorage.removeItem(REFRESH_TOKEN);
    setExp(null);
    setState(initialState);
    delete axios.defaults.headers.common.authorization;
  }, []);

  /**
   * Conveniently fetch an access token.
   *
   * @param grantType The grant type to authenticate with
   * @param params Additional parameters, which depend on the grant type.
   */
  const fetchToken = React.useCallback(
    async (grantType: string, params: { [key: string]: string }) => {
      const {
        data: { access_token: accessToken, refresh_token: rt },
      } = await axios.post<TokenResponse>(
        `${settings.apiUrl}/oauth2/token`,
        new URLSearchParams({
          client_id: `app:${settings.id}`,
          grant_type: grantType,
          scope: 'openid',
          ...params,
        }),
      );
      const payload = jwtDecode<JwtPayload>(accessToken);
      localStorage.setItem(REFRESH_TOKEN, rt);
      axios.defaults.headers.common.authorization = `Bearer ${accessToken}`;
      setExp(payload.exp);
      return payload;
    },
    [],
  );

  /**
   * Fetch an access token, the user info, and member role, or log out if any step fails.
   *
   * @param grantType The grant type to authenticate with
   * @param params Additional parameters, which depend on the grant type.
   */
  const login = React.useCallback(
    async <P extends {}>(grantType: string, params: P) => {
      try {
        const { sub } = await fetchToken(grantType, params);
        const [{ data: userInfo }, role] = await Promise.all([
          axios.get<UserInfo>(`${settings.apiUrl}/api/connect/userinfo`),
          axios.get<AppMember>(`${settings.apiUrl}/api/apps/${settings.id}/members/${sub}`).then(
            ({ data }) => data.role,
            error => {
              const { policy, role: defaultRole } = definition.security.default;
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
        ]);
        setState({
          isLoggedIn: true,
          role,
          userInfo,
        });
      } catch (error) {
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
  const passwordLogin = React.useCallback(
    (credentials: PasswordLoginParams) => login('password', credentials),
    [login],
  );

  /**
   * Login using an OAuth2 authorization code.
   *
   * @param credentials The authorization code and redirect uri.
   */
  const authorizationCodeLogin = React.useCallback(
    (credentials: AuthorizationCodeLoginParams) => login('authorization_code', credentials),
    [login],
  );

  // Initialize the login session/
  React.useEffect(() => {
    // If the app doesn’t have a security definition, don’t even bother initializing anything.
    if (!definition.security) {
      return;
    }

    const rt = localStorage.getItem(REFRESH_TOKEN);
    if (rt) {
      // If a refresh token is known, start a new session.
      login('refresh_token', { refresh_token: rt }).finally(() => setLoading(false));
    } else {
      // Otherwise make sure the state is fully reset.
      logout();
      setLoading(false);
    }
  }, [definition, login, logout]);

  // Handle refreshing access tokens
  React.useEffect(() => {
    // Don’t start the refresh token loop until an access token expiration is known.
    if (exp == null) {
      return undefined;
    }

    // exp is in seconds
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
      } catch (error) {
        // If refreshing the session fails for any reason, log out the user.
        logout();
      }
    }, timeout);
    return () => {
      // If a new timeout is registered, clear the old one.
      clearTimeout(timeoutId);
    };
  }, [exp, fetchToken, logout]);

  // The value is memoized to prevent unnecessary rerenders.
  const value = React.useMemo(() => ({ authorizationCodeLogin, passwordLogin, logout, ...state }), [
    authorizationCodeLogin,
    passwordLogin,
    logout,
    state,
  ]);

  // If security hasn’t been initialized yet, show a loader instead of the children. This prevents
  // children from crashing when the context is still undefined.
  if (isLoading) {
    return <Loader />;
  }

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useUser(): UserContext {
  return React.useContext(Context);
}
