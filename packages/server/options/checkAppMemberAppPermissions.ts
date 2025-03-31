import { type CheckAppMemberAppPermissionsParams } from '@appsemble/node-utils';

import { checkAppMemberAppPermissions as checkAppMemberAppPermissionsServer } from '../utils/authorization.js';

export function checkAppMemberAppPermissions({
  app,
  context,
  permissions,
}: CheckAppMemberAppPermissionsParams): Promise<void> {
  return checkAppMemberAppPermissionsServer({
    context,
    // @ts-expect-error 2322 undefined is not assignable to type (strictNullChecks)
    appId: app.id,
    requiredPermissions: permissions,
  });
}
