import { App } from '@appsemble/types';
import axios from 'axios';

import { Member } from '../types';

export async function getAppMembers(app: App): Promise<Member[]> {
  const { data: appMembers } = await axios.get<Member[]>(`/api/apps/${app.id}/members`);
  if (app.definition.security.default.policy === 'invite') {
    return appMembers;
  }

  const { data: organizationMembers } = await axios.get<Member[]>(
    `/api/organizations/${app.OrganizationId}/members`,
  );

  return [
    ...organizationMembers.map((orgMem) => {
      const appMember = appMembers.find((appMem) => appMem.id === orgMem.id);
      return appMember || { ...orgMem, role: app.definition.security.default.role };
    }),
    ...appMembers.filter(
      (appMem) => !organizationMembers.some((orgMem) => orgMem.id === appMem.id),
    ),
  ] as Member[];
}
