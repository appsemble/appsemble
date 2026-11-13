import { describe, expect, it } from 'vitest';

import { down, up } from './0.41.2.js';
import { getDB, Organization, OrganizationMember, User } from '../../models/index.js';

describe('migration 0.41.2', () => {
  it('preserves manual memberships when rolling back group-managed access', async () => {
    const db = getDB();
    const transaction = await db.transaction();
    try {
      await Organization.create({ id: 'staff' }, { transaction });
      const user = await User.create({ timezone: 'Europe/Amsterdam' }, { transaction });
      await OrganizationMember.create(
        {
          OrganizationId: 'staff',
          UserId: user.id,
          role: 'Owner',
        },
        { transaction },
      );
      const staff = await User.create({ timezone: 'Europe/Amsterdam' }, { transaction });
      await OrganizationMember.create(
        {
          OrganizationId: 'staff',
          UserId: staff.id,
          role: null,
          ssoRoles: ['AppManager'],
        },
        { transaction },
      );
      await down(transaction, db);
      await up(transaction, db);
      const members = await OrganizationMember.findAll({
        where: { OrganizationId: 'staff' },
        transaction,
      });
      expect(
        members.map((member) => ({
          userId: member.UserId,
          role: member.role,
          ssoRoles: member.ssoRoles,
          guest: member.guest,
        })),
      ).toStrictEqual([
        {
          userId: user.id,
          role: 'Owner',
          ssoRoles: [],
          guest: false,
        },
      ]);
    } finally {
      await transaction.rollback();
    }
  });
});
