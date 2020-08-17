import { Permission, roles } from '@appsemble/utils';
import Boom from '@hapi/boom';

import { Member } from '../models';
import type { KoaContext } from '../types';

/**
 * Check if the authenticated user has permission to perform an action within an organization.
 *
 * @param ctx - The Koa context that should contain the authenticated user and the database.
 * @param organizationId - The id of which to check if the user may persoem the action for.
 * @param permissions - An array of required permissions or a single required permission.
 */
export async function checkRole(
  ctx: KoaContext,
  organizationId: string,
  permissions: Permission | Permission[],
): Promise<void> {
  const { user } = ctx;
  if (!user) {
    throw Boom.unauthorized();
  }

  const member = await Member.findOne({
    attributes: ['role'],
    raw: true,
    where: { OrganizationId: organizationId, UserId: user.id },
  });

  if (!member) {
    throw Boom.forbidden('User is not part of this organization.');
  }

  const role = roles[member.role];

  if (![].concat(permissions).every((p) => role.includes(p))) {
    throw Boom.forbidden('User does not have sufficient permissions.');
  }
}
