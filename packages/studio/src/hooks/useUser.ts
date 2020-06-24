import type { TokenResponse, UserInfo } from '@appsemble/types';
import { createContext, useContext } from 'react';

interface UserContext {
  login(tokenResponse: TokenResponse): void;
  logout(): void;
  userInfo: UserInfo;
  refreshUserInfo(): Promise<void>;
}

export const UserContext = createContext<UserContext>(null);

export default function useUser(): UserContext {
  return useContext(UserContext);
}
