import { CheckRoleParams } from '@appsemble/node-utils/server/types';

import { checkRole as checkRoleServer } from '../utils/checkRole.js';

export const checkRole = ({
  app,
  context,
  findOptions,
  permissions,
}: CheckRoleParams): Promise<Record<string, any>> =>
  checkRoleServer(context, app.OrganizationId, permissions, findOptions);
