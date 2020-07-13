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

const Context = createContext<{ organizations: Organization[]; loading: boolean }>({
  organizations: [],
  loading: true,
});

interface OrganizationsProviderProps {
  children: ReactNode;
}

export default function OrganizationsProvider({
  children,
}: OrganizationsProviderProps): ReactElement {
  const { userInfo } = useUser();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  const value = useMemo(() => ({ organizations, loading }), [organizations, loading]);

  useEffect(() => {
    const getOrganizations = async (): Promise<void> => {
      if (userInfo) {
        const { data } = await axios.get('/api/user/organizations');
        setOrganizations(data);
      } else {
        setOrganizations([]);
      }
      setLoading(false);
    };

    getOrganizations();
  }, [userInfo]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useOrganizations(): { organizations: Organization[]; loading: boolean } {
  return useContext(Context);
}
