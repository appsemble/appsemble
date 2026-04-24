import { randomUUID } from 'node:crypto';

import { QueryTypes, type Transaction } from 'sequelize';
import { describe, expect, it } from 'vitest';

import { down, up } from './0.36.8.js';
import { AppCollection, getDB, Organization } from '../../models/index.js';

function buildCollectionValues(
  organizationId: string,
  domain: string | null,
): Parameters<typeof AppCollection.create>[0] {
  return {
    name: `Collection-${randomUUID()}`,
    expertName: 'Expert',
    expertProfileImage: Buffer.from('expertProfileImage'),
    expertProfileImageMimeType: 'image/png',
    headerImage: Buffer.from('headerImage'),
    headerImageMimeType: 'image/png',
    expertDescription: 'Description',
    OrganizationId: organizationId,
    visibility: 'public' as const,
    domain: domain ?? undefined,
  };
}

function createPreMigrationCollection(
  organizationId: string,
  domain: string | null,
  transaction: Transaction,
): Promise<AppCollection> {
  return AppCollection.create(buildCollectionValues(organizationId, domain), {
    transaction,
    hooks: false,
  });
}

function createCollection(
  organizationId: string,
  domain: string | null,
  transaction: Transaction,
): Promise<AppCollection> {
  return AppCollection.create(buildCollectionValues(organizationId, domain), {
    transaction,
  });
}

describe('migration 0.36.8', () => {
  it('should normalize domains and enforce uniqueness', async () => {
    const db = getDB();

    await db.transaction(async (transaction) => {
      await db.query('DROP INDEX IF EXISTS "UniqueAppCollectionDomain";', {
        transaction,
      });
      await db.query('DROP INDEX IF EXISTS "appCollectionComposite";', {
        transaction,
      });
      await db.query(
        'CREATE INDEX "appCollectionComposite" ON "AppCollection" ("domain", "updated" DESC);',
        { transaction },
      );

      const organization = await Organization.create(
        {
          id: randomUUID(),
          name: 'Test Organization',
        },
        { transaction, hooks: false },
      );

      const staleCollection = await createPreMigrationCollection(
        organization.id,
        '  EXAMPLE.TEST  ',
        transaction,
      );
      const currentCollection = await createPreMigrationCollection(
        organization.id,
        'example.test',
        transaction,
      );
      const emptyDomainCollection = await createPreMigrationCollection(
        organization.id,
        '   ',
        transaction,
      );

      await up(transaction, db);

      await staleCollection.reload({ transaction });
      await currentCollection.reload({ transaction });
      await emptyDomainCollection.reload({ transaction });

      expect(staleCollection.domain).toBeNull();
      expect(currentCollection.domain).toBe('example.test');
      expect(emptyDomainCollection.domain).toBeNull();

      const uniqueIndexes = await db.query<{ indexname: string }>(
        `
          SELECT indexname
          FROM pg_indexes
          WHERE schemaname = current_schema()
            AND tablename = 'AppCollection'
            AND indexname = 'UniqueAppCollectionDomain';
        `,
        { transaction, type: QueryTypes.SELECT },
      );
      expect(uniqueIndexes).toHaveLength(1);

      await expect(
        createCollection(organization.id, 'example.test', transaction),
      ).rejects.toBeInstanceOf(Error);
    });
  });

  it('should restore non-unique domain index on down', async () => {
    const db = getDB();

    await db.transaction(async (transaction) => {
      await db.query('DROP INDEX IF EXISTS "UniqueAppCollectionDomain";', {
        transaction,
      });
      await db.query('DROP INDEX IF EXISTS "appCollectionComposite";', {
        transaction,
      });
      await db.query(
        'CREATE INDEX "appCollectionComposite" ON "AppCollection" ("domain", "updated" DESC);',
        { transaction },
      );

      const organization = await Organization.create(
        {
          id: randomUUID(),
          name: 'Test Organization',
        },
        { transaction, hooks: false },
      );

      await createPreMigrationCollection(organization.id, 'example.test', transaction);
      await up(transaction, db);
      await down(transaction, db);

      const uniqueIndexes = await db.query<{ indexname: string }>(
        `
          SELECT indexname
          FROM pg_indexes
          WHERE schemaname = current_schema()
            AND tablename = 'AppCollection'
            AND indexname = 'UniqueAppCollectionDomain';
        `,
        { transaction, type: QueryTypes.SELECT },
      );
      expect(uniqueIndexes).toHaveLength(0);

      const compositeIndexes = await db.query<{ indexname: string }>(
        `
          SELECT indexname
          FROM pg_indexes
          WHERE schemaname = current_schema()
            AND tablename = 'AppCollection'
            AND indexname = 'appCollectionComposite';
        `,
        { transaction, type: QueryTypes.SELECT },
      );
      expect(compositeIndexes).toHaveLength(1);

      expect(await createCollection(organization.id, 'example.test', transaction)).toBeDefined();
    });
  });
});
