import { type Transaction } from 'sequelize';

import { OAuth2ClientCredentials, OrganizationMember, User } from '../models/index.js';

/**
 * Create a service account with client credentials in an organization.
 *
 * @param serviceAccount The organization, role and client credentials of the service account. The
 *   secret must already be hashed.
 * @param transaction The transaction in which to create it.
 * @returns The client credentials of the service account.
 */
export async function createServiceAccount(
  {
    description,
    expires,
    id,
    OrganizationId,
    role,
    scopes,
    secret,
  }: Pick<OAuth2ClientCredentials, 'description' | 'expires' | 'id' | 'scopes' | 'secret'> &
    Pick<OrganizationMember, 'OrganizationId' | 'role'>,
  transaction: Transaction,
): Promise<OAuth2ClientCredentials> {
  const user = await User.create({ name: description, timezone: 'UTC' }, { transaction });
  await OrganizationMember.create(
    { OrganizationId, UserId: user.id, role, serviceAccount: true },
    { transaction },
  );
  return OAuth2ClientCredentials.create(
    { id, description, expires, scopes, secret, UserId: user.id },
    { transaction },
  );
}

/**
 * Revoke service accounts by deleting their client credentials and memberships.
 *
 * @param where The organization, and optionally the account, of the service accounts to revoke.
 * @param transaction The transaction in which to revoke them.
 */
export async function revokeServiceAccounts(
  where: Partial<Pick<OrganizationMember, 'UserId'>> & Pick<OrganizationMember, 'OrganizationId'>,
  transaction: Transaction,
): Promise<void> {
  const members = await OrganizationMember.findAll({
    attributes: ['UserId'],
    where: { ...where, serviceAccount: true },
    transaction,
  });
  const ids = members.map(({ UserId }) => UserId);
  await OAuth2ClientCredentials.destroy({ where: { UserId: ids }, transaction });
  await OrganizationMember.destroy({ where: { UserId: ids }, transaction });
}
