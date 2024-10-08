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
    appId: app?.id,
    requiredPermissions: permissions,
    groupId,
  });
}
