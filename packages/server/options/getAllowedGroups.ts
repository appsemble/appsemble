import { type CheckAppPermissionsParams } from '@appsemble/node-utils';

import { getPermittedGroups } from '../utils/authorization.js';

export function getAllowedGroups({
  app,
  context,
  groupId,
  permissions,
}: CheckAppPermissionsParams): Promise<number[]> {
  return getPermittedGroups({
    context,
    // @ts-expect-error 2322 undefined is not assignable to type (strictNullChecks)
    appId: app?.id,
    requiredPermissions: permissions,
    groupId,
  });
}
