import { type Transaction } from 'sequelize';

import { OAuth2ClientCredentials, OrganizationMember, User } from '../models/index.js';

/**
 * Revoke service accounts by deleting their client credentials, memberships and accounts.
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
  await User.destroy({ where: { id: ids }, transaction });
}
