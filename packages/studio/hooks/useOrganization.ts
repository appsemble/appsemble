import { createContext, useContext } from 'react';

import { Organization } from '../types';

export const OrganizationContext = createContext<Organization[]>(null);

export default function useOrganization(): Organization[] {
  return useContext(OrganizationContext);
}
