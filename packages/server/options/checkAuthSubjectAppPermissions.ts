import { type CheckAuthSubjectAppPermissionsParams } from '@appsemble/node-utils';

import { checkAuthSubjectAppPermissions as checkAuthSubjectAppPermissionsServer } from '../utils/authorization.js';

export function checkAuthSubjectAppPermissions({
  app,
  context,
  permissions,
}: CheckAuthSubjectAppPermissionsParams): Promise<void> {
  return checkAuthSubjectAppPermissionsServer({
    context,
    // @ts-expect-error 2322 undefined is not assignable to type (strictNullChecks)
    appId: app.id,
    requiredPermissions: permissions,
  });
}
