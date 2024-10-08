import { type CheckAppMemberAppPermissionsParams } from '@appsemble/node-utils';

import { checkAppMemberAppPermissions as checkAppMemberAppPermissionsServer } from '../utils/authorization.js';

export function checkAppMemberAppPermissions({
  app,
  context,
  permissions,
}: CheckAppMemberAppPermissionsParams): Promise<void> {
  return checkAppMemberAppPermissionsServer({
    context,
    appId: app.id,
    requiredPermissions: permissions,
  });
}
