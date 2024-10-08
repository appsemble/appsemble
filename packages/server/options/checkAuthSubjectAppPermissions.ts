import { type CheckAuthSubjectAppPermissionsParams } from '@appsemble/node-utils';

import { checkAuthSubjectAppPermissions as checkAuthSubjectAppPermissionsServer } from '../utils/authorization.js';

export function checkAuthSubjectAppPermissions({
  app,
  context,
  permissions,
}: CheckAuthSubjectAppPermissionsParams): Promise<void> {
  return checkAuthSubjectAppPermissionsServer({
    context,
    appId: app.id,
    requiredPermissions: permissions,
  });
}
