import axios from 'axios';
import React, {
  createContext,
  ReactElement,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type { Organization } from '../../types';
import { useUser } from '../UserProvider';

const Context = createContext<Organization[]>(null);

interface OrganizationsProviderProps {
  children: ReactNode;
}

export default function OrganizationsProvider({
  children,
}: OrganizationsProviderProps): ReactElement {
  const { userInfo } = useUser();
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  const value = useMemo(() => organizations, [organizations]);

  useEffect(() => {
    const getOrganizations = async (): Promise<void> => {
      if (userInfo) {
        const { data } = await axios.get('/api/user/organizations');
        setOrganizations(data);
      } else {
        setOrganizations([]);
      }
    };

    getOrganizations();
  }, [userInfo]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useOrganizations(): Organization[] {
  return useContext(Context);
}
