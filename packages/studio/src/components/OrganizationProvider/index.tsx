import axios from 'axios';
import React, { ReactElement, ReactNode, useEffect, useMemo, useState } from 'react';

import { OrganizationContext } from '../../hooks/useOrganizations';
import useUser from '../../hooks/useUser';
import type { Organization } from '../../types';

interface OrganizationProviderProps {
  children: ReactNode;
}

export default function OrganizationProvider({
  children,
}: OrganizationProviderProps): ReactElement {
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

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
}
