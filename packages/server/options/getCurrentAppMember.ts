import { type GetCurrentAppMemberParams } from '@appsemble/node-utils';
import { type AppMemberInfo } from '@appsemble/types';

import { getAppMemberInfoById } from '../utils/appMember.js';

export function getCurrentAppMember({
  context: { user: authSubject },
}: GetCurrentAppMemberParams): Promise<AppMemberInfo | null> {
  return authSubject ? getAppMemberInfoById(authSubject.id) : Promise.resolve(null);
}
