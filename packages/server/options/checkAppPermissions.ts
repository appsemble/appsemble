import { type CheckAppPermissionsParams } from '@appsemble/node-utils';

import { checkAppPermissions as checkAppPermissionsServer } from '../utils/authorization.js';

export function checkAppPermissions({
  app,
  context,
  groupId,
  permissions,
}: CheckAppPermissionsParams): Promise<void> {
  return checkAppPermissionsServer({
    context,
    // @ts-expect-error 2322 undefined is not assignable to type (strictNullChecks)
    appId: app?.id,
    requiredPermissions: permissions,
    groupId,
  });
}
