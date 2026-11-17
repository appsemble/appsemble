import { beforeAll, describe, expect, it } from 'vitest';

import { down, up } from './0.41.3.js';
import { getDB, Organization, OrganizationSsoDomain } from '../../models/index.js';
import { setArgv } from '../../utils/argv.js';
import { applyOrganizationSsoConfiguration } from '../../utils/organizationSso.js';

describe('migration 0.41.3', () => {
  beforeAll(() => {
    setArgv({ aesSecret: 'test-encryption' });
  });

  it('preserves SSO configuration when the domain migration is rolled back and reapplied', async () => {
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
        {
          OrganizationId: 'staff',
          domain: 'example.com',
          verifiedAt: new Date(),
          managedBy: 'deployment',
        },
        { transaction },
      );
      const claims = await OrganizationSsoDomain.findAll({ transaction });
      expect(claims.map(({ domain, managedBy }) => ({ domain, managedBy }))).toStrictEqual([
        { domain: 'example.com', managedBy: 'deployment' },
      ]);
    } finally {
      await transaction.rollback();
    }
  });
});
