import { type CheckRoleParams } from '@appsemble/node-utils';

import { checkRole as checkRoleServer } from '../utils/checkRole.js';

export function checkRole({
  app,
  context,
  findOptions,
  permissions,
}: CheckRoleParams): Promise<Record<string, any>> {
  return checkRoleServer(context, app.OrganizationId, permissions, findOptions);
}
