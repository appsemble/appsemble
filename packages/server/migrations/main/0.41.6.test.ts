import { PredefinedOrganizationRole } from '@appsemble/types';
import { describe, expect, it } from 'vitest';

import { down, up } from './0.41.6.js';
import {
  getDB,
  OAuth2ClientCredentials,
  Organization,
  OrganizationMember,
  User,
} from '../../models/index.js';

describe('migration 0.41.6', () => {
  it('revokes service accounts and keeps people when rolled back', async () => {
    const db = getDB();
    const transaction = await db.transaction();
    try {
      await Organization.create({ id: 'staff' }, { transaction });
      const person = await User.create({ timezone: 'UTC' }, { transaction });
      const serviceAccount = await User.create({ timezone: 'UTC' }, { transaction });
      await OrganizationMember.create(
        { OrganizationId: 'staff', UserId: person.id, role: PredefinedOrganizationRole.Owner },
        { transaction },
      );
      await OrganizationMember.create(
        {
          OrganizationId: 'staff',
          UserId: serviceAccount.id,
          role: PredefinedOrganizationRole.Maintainer,
          serviceAccount: true,
        },
        { transaction },
      );
      for (const user of [person, serviceAccount]) {
        await OAuth2ClientCredentials.create(
          {
            id: user.id,
            description: 'CLI',
            scopes: 'apps:write',
            secret: 'hash',
            UserId: user.id,
          },
          { transaction },
        );
      }
      await down(transaction, db);
      const remaining = {
        users: await User.findAll({ attributes: ['id'], transaction }),
        members: await OrganizationMember.findAll({ attributes: ['UserId'], transaction }),
        credentials: await OAuth2ClientCredentials.findAll({ attributes: ['UserId'], transaction }),
      };
      await up(transaction, db);
      expect({
        users: remaining.users.map(({ id }) => id),
        members: remaining.members.map(({ UserId }) => UserId),
        credentials: remaining.credentials.map(({ UserId }) => UserId),
      }).toStrictEqual({ users: [person.id], members: [person.id], credentials: [person.id] });
    } finally {
      await transaction.rollback();
    }
  });
});
