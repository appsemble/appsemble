import { Permission, roles } from '@appsemble/utils';
import { forbidden, unauthorized } from '@hapi/boom';
import { Context } from 'koa';
import { FindOptions } from 'sequelize';

import { Member } from '../models';

/**
 * Check if the authenticated user has permission to perform an action within an organization.
 *
 * @param ctx The Koa context that should contain the authenticated user and the database.
 * @param organizationId The id of which to check if the user may persoem the action for.
 * @param permissions An array of required permissions or a single required permission.
 * @param queryOptions Additional query options. Use this to include for example the user or
 * organization the member is linked to.
 * @returns The member of the organization.
 */
export async function checkRole(
  ctx: Context,
  organizationId: string,
  permissions: Permission | Permission[],
  { attributes = [], ...queryOptions }: FindOptions = {},
): Promise<Member> {
  const { user } = ctx;
  if (!user) {
    throw unauthorized();
  }

  const member = await Member.findOne({
    attributes: [...new Set([...(attributes as string[]), 'role'])],
    ...queryOptions,
    where: { OrganizationId: organizationId, UserId: user.id },
  });

  if (!member) {
    throw forbidden('User is not part of this organization.');
  }

  const role = roles[member.role];

  if (![].concat(permissions).every((p) => role.includes(p))) {
    throw forbidden('User does not have sufficient permissions.');
  }

  return member;
}
