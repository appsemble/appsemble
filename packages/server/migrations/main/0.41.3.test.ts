import { beforeAll, describe, expect, it } from 'vitest';

import { down, up } from './0.41.3.js';
import { getDB, Organization, OrganizationSso, OrganizationSsoDomain } from '../../models/index.js';
import { setArgv } from '../../utils/argv.js';
import { applyOrganizationSsoConfiguration } from '../../utils/organizationSso.js';

describe('migration 0.41.3', () => {
  beforeAll(() => {
    setArgv({ aesSecret: 'test-encryption' });
  });

  it('stores domains for an SSO configuration kept across a rollback and removes them with it', async () => {
    const db = getDB();
    const transaction = await db.transaction();
    try {
      await Organization.create({ id: 'staff' }, { transaction });
      await applyOrganizationSsoConfiguration(
        'staff',
        {
          issuer: 'https://identity.example.com',
          clientId: 'studio',
          clientSecret: 'secret',
          name: 'Staff SSO',
          scope: 'openid email profile',
          groupClaim: 'groups',
          roleMappings: [],
          policy: 'optional',
          allowedLoginMethods: ['oidc'],
        },
        'deployment',
        transaction,
      );
      await down(transaction, db);
      await up(transaction, db);
      await OrganizationSsoDomain.create(
        { OrganizationId: 'staff', domain: 'example.com' },
        { transaction },
      );
      const stored = await OrganizationSsoDomain.findAll({ transaction });
      await OrganizationSso.destroy({ where: { OrganizationId: 'staff' }, transaction });
      expect({
        stored: stored.map(({ OrganizationId, domain }) => ({ OrganizationId, domain })),
        remaining: await OrganizationSsoDomain.count({ transaction }),
      }).toStrictEqual({
        stored: [{ OrganizationId: 'staff', domain: 'example.com' }],
        remaining: 0,
      });
    } finally {
      await transaction.rollback();
    }
  });
});
