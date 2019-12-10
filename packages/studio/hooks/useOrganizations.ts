import { createContext, useContext } from 'react';

import { Organization } from '../types';

export const OrganizationContext = createContext<Organization[]>(null);

export default function useOrganizations(): Organization[] {
  return useContext(OrganizationContext);
}
