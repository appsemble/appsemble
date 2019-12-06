import Boom from '@hapi/boom';

/**
 * Check if the authenticated user has permission to perform an action within an organization.
 *
 * @param ctx The Koa context that should contain the authenticated user and the database.
 * @param organizationId The id of which to check if the user may persoem the action for.
 */
export default async function checkRole(ctx, organizationId) {
  const { user } = ctx.state;
  const { Member } = ctx.db.models;

  if (!user) {
    throw Boom.unauthorized();
  }

  // XXX check permissions for real
  const count = await Member.count({
    raw: true,
    where: { OrganizationId: organizationId, UserId: user.id },
  });
  if (!count) {
    throw Boom.forbidden();
  }
}
