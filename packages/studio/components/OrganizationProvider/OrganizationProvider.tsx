import axios from 'axios';
import * as React from 'react';

import { OrganizationContext } from '../../hooks/useOrganization';
import { Organization, User } from '../../types';

export interface OrganizationProviderProps {
  children: React.ReactNode;
  user: User;
}

export default function OrganizationProvider({
  children,
  user,
}: OrganizationProviderProps): React.ReactElement {
  const [organizations, setOrganizations] = React.useState<Organization[]>([]);

  const value = React.useMemo(() => organizations, [organizations]);

  React.useEffect(() => {
    const getOrganizations = async (): Promise<void> => {
      if (user != null) {
        const { data } = await axios.get('/api/user/organizations');
        setOrganizations(data);
      } else {
        setOrganizations([]);
      }
    };
    getOrganizations();
  }, [user]);

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
}
