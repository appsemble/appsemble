import { type AppMemberInfo } from '@appsemble/types';
import axios from 'axios';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { apiUrl, appId, showDemoLogin } from '../../utils/settings.js';

interface DemoAppMembersContext {
  demoAppMembers: AppMemberInfo[];
  refetchDemoAppMembers: () => Promise<void>;
}

interface DemoAppMembersProviderProps {
  readonly children: ReactNode;
}

const Context = createContext<DemoAppMembersContext>(null);

export function DemoAppMembersProvider({ children }: DemoAppMembersProviderProps): ReactNode {
  const [demoAppMembers, setDemoAppMembers] = useState<AppMemberInfo[]>([]);

  const refetchDemoAppMembers = useCallback(async () => {
    if (showDemoLogin) {
      const response = await axios.get<AppMemberInfo[]>(`${apiUrl}/api/apps/${appId}/demo-members`);
      if (response.data) {
        setDemoAppMembers(response.data);
      }
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refetchDemoAppMembers();
    })();
  }, [refetchDemoAppMembers]);

  const value = useMemo(
    () => ({
      demoAppMembers,
      refetchDemoAppMembers,
    }),
    [demoAppMembers, refetchDemoAppMembers],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useDemoAppMembers(): DemoAppMembersContext {
  return useContext(Context);
}
