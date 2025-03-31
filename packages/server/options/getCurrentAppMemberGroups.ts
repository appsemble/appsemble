import { type GetCurrentAppMemberGroupsParams } from '@appsemble/node-utils';
import { type Group } from '@appsemble/types';

import { getAppMemberGroups } from '../utils/appMember.js';

export function getCurrentAppMemberGroups({
  app,
  context: { user: authSubject },
}: GetCurrentAppMemberGroupsParams): Promise<Group[] | null> {
  return authSubject ? getAppMemberGroups(authSubject!.id, app.id!) : Promise.resolve(null);
}
