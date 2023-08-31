import { assertKoaError } from '@appsemble/node-utils';
import { type Permission, roles } from '@appsemble/utils';
import { type Context } from 'koa';
import { type FindOptions } from 'sequelize';

import { Member } from '../models/index.js';

/**
 * Check if the authenticated user has permission to perform an action within an organization.
 *
 * @param ctx The Koa context that should contain the authenticated user and the database.
 * @param organizationId The id of which to check if the user may perform the action for.
 * @param permissions An array of required permissions or a single required permission.
 * @param queryOptions Additional query options. Use this to include for example the user or
 *   organization the member is linked to.
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
    ctx.throw(401);
  }

  const member = await Member.findOne({
    attributes: [...new Set([...(attributes as string[]), 'role'])],
    ...queryOptions,
    where: { OrganizationId: organizationId, UserId: user.id },
  });

  assertKoaError(!member, ctx, 403, 'User is not part of this organization.');

  const role = roles[member.role];

  assertKoaError(
    ![].concat(permissions).every((p) => role.includes(p)),
    ctx,
    403,
    'User does not have sufficient permissions.',
  );

  return member;
}
