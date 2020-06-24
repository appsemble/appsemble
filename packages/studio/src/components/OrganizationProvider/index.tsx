import axios from 'axios';
import * as React from 'react';

import { OrganizationContext } from '../../hooks/useOrganizations';
import useUser from '../../hooks/useUser';
import type { Organization } from '../../types';

interface OrganizationProviderProps {
  children: React.ReactNode;
}

export default function OrganizationProvider({
  children,
}: OrganizationProviderProps): React.ReactElement {
  const { userInfo } = useUser();
  const [organizations, setOrganizations] = React.useState<Organization[]>([]);

  const value = React.useMemo(() => organizations, [organizations]);

  React.useEffect(() => {
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

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
}
