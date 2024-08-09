import { type CheckUserOrganizationPermissionsParams } from '@appsemble/node-utils';

import { checkUserOrganizationPermissions as checkUserOrganizationPermissionsServer } from '../utils/authorization.js';

export function checkUserOrganizationPermissions({
  app,
  context,
  permissions,
}: CheckUserOrganizationPermissionsParams): Promise<void> {
  return checkUserOrganizationPermissionsServer(context, app.OrganizationId, permissions);
}
