import { AppMember, UserInfo } from '@appsemble/types';
import axios from 'axios';
import jwtDecode from 'jwt-decode';
import * as React from 'react';

import settings from '../../utils/settings';
import { useAppDefinition } from '../AppDefinitionProvider';

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
  const { definition } = useAppDefinition();

  const [isLoggedIn, setLoggedIn] = React.useState(false);
  const [refreshToken, setRefreshToken] = React.useState<string>(null);
  const [userInfo, setUserInfo] = React.useState<UserInfo>(null);
  const [role, setRole] = React.useState<string>(null);

  const login = React.useCallback(
    async ({ password, username }) => {
      const auths = definition.authentication;
      if (!auths?.length) {
        setLoggedIn(false);
        setUserInfo(null);
      }
      const [auth] = auths;
      if (auth.method !== 'email') {
        throw new Error(`Unsupported authentication method: ${auth.method}`);
      }
      const {
        data: { access_token: at, refresh_token: rt },
      } = await axios.post<TokenResponse>(
        auth.url,
        new URLSearchParams(
          [
            ['client_id', auth.clientId],
            ['client_secret', auth.clientSecret],
            ['grant_type', 'password'],
            ['password', password],
            ['username', username],
          ].filter(([, value]) => value),
        ),
      );

      const authorization = `Bearer ${at}`;
      const { exp, scopes, sub, iss } = jwtDecode<JwtPayload>(at);
      const { data: user } = await axios.get<UserInfo>(`${iss}/api/connect/userinfo`, {
        headers: { authorization },
      });

      let member: AppMember;
      if (definition.security !== undefined) {
        ({ data: member } = await axios.get<AppMember>(`/api/apps/${settings.id}/members/${sub}`));
      }

      axios.defaults.headers.common.authorization = authorization;
      setRole(member.role);
      setUserInfo(user);
      setRefreshToken(rt);
      setLoggedIn(true);
    },
    [definition.authentication, definition.security],
  );

  const logout = React.useCallback(() => {
    delete axios.defaults.headers.common.authentication;
    setLoggedIn(false);
    setRefreshToken(null);
    setUserInfo(null);
    setRole(null);
  }, []);

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
