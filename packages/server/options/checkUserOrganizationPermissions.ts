import { type CheckUserOrganizationPermissionsParams } from '@appsemble/node-utils';

import { checkUserOrganizationPermissions as checkUserOrganizationPermissionsServer } from '../utils/authorization.js';

export async function checkUserOrganizationPermissions({
  app,
  context,
  permissions,
}: CheckUserOrganizationPermissionsParams): Promise<void> {
  await checkUserOrganizationPermissionsServer({
    context,
    organizationId: app.OrganizationId,
    requiredPermissions: permissions,
  });
}
