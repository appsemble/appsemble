import { type AppMember } from '@appsemble/types';
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
  demoAppMembers: AppMember[];
  refetchDemoAppMembers: () => Promise<void>;
}

interface DemoAppMembersProviderProps {
  readonly children: ReactNode;
}

const Context = createContext<DemoAppMembersContext>(null);

export function DemoAppMembersProvider({ children }: DemoAppMembersProviderProps): ReactNode {
  const [demoAppMembers, setDemoAppMembers] = useState<AppMember[]>([]);

  const refetchDemoAppMembers = useCallback(async () => {
    if (showDemoLogin) {
      const response = await axios.get(`${apiUrl}/api/apps/${appId}/demoMembers`);
      if (response.data) {
        setDemoAppMembers(response.data.filter((appMember: AppMember) => appMember.demo));
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
