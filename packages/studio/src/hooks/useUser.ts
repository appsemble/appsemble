import type { UserInfo } from '@appsemble/types';
import { createContext, useContext } from 'react';

import type { TokenResponse } from '../types';

interface UserContext {
  login(tokenResponse: TokenResponse): void;
  logout(): void;
  userInfo: UserInfo;
  refreshUserInfo(): Promise<void>;
  initialized: boolean;
}

export const UserContext = createContext<UserContext>(null);

export default function useUser(): UserContext {
  return useContext(UserContext);
}
