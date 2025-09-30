import { type GetCurrentAppMemberParams } from '@appsemble/node-utils';
import { type AppMemberInfo } from '@appsemble/types';

import { getAppMemberInfoById } from '../utils/appMember.js';

export function getCurrentAppMember({
  app,
  context: { user: authSubject },
}: GetCurrentAppMemberParams): Promise<AppMemberInfo | null> {
  return authSubject ? getAppMemberInfoById(app.id!, authSubject.id) : Promise.resolve(null);
}
