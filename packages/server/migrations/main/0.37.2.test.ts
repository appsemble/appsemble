import { QueryTypes, type Sequelize, type Transaction } from 'sequelize';
import { describe, expect, it } from 'vitest';

import { down } from './0.37.2.js';
import { BlockAsset, BlockVersion, getDB, Organization } from '../../models/index.js';

async function isContentNullable(db: Sequelize, transaction: Transaction): Promise<boolean> {
  const [column] = await db.query<{ is_nullable: string }>(
    `SELECT is_nullable FROM information_schema.columns
       WHERE table_schema = current_schema()
         AND table_name = 'BlockAsset'
         AND column_name = 'content'`,
    { transaction, type: QueryTypes.SELECT },
  );
  return column.is_nullable === 'YES';
}

async function columnExists(
  db: Sequelize,
  transaction: Transaction,
  column: string,
): Promise<boolean> {
  const rows = await db.query(
    `SELECT 1 FROM information_schema.columns
       WHERE table_schema = current_schema()
         AND table_name = 'BlockAsset'
         AND column_name = :column`,
    { replacements: { column }, transaction, type: QueryTypes.SELECT },
  );
  return rows.length > 0;
}

describe('migration 0.37.2', () => {
  it('should leave content nullable on down when assets have been migrated to S3', async () => {
    const db = getDB();
    const transaction = await db.transaction();
    try {
      await Organization.create({ id: 'org', name: 'org' }, { transaction, hooks: false });
      const version = await BlockVersion.create(
        { OrganizationId: 'org', name: 'test', version: '1.2.3' },
        { transaction, hooks: false },
      );
      // A migrated asset has its bytes in S3 only, so content is null.
      await BlockAsset.create(
        {
          BlockVersionId: version.id,
          content: null,
          filename: 'a.js',
          mime: 'application/javascript',
          size: 3,
          storageKey: 'org/test/1.2.3/hash/a.js',
        },
        { transaction, hooks: false },
      );

      // Must not throw: restoring NOT NULL would fail on the null-content row.
      await down(transaction, db);

      expect(await columnExists(db, transaction, 'storageKey')).toBe(false);
      expect(await isContentNullable(db, transaction)).toBe(true);
    } finally {
      await transaction.rollback();
    }
  });

  it('should restore the content NOT NULL constraint on down when no asset is S3-only', async () => {
    const db = getDB();
    const transaction = await db.transaction();
    try {
      await down(transaction, db);

      expect(await columnExists(db, transaction, 'storageKey')).toBe(false);
      expect(await isContentNullable(db, transaction)).toBe(false);
    } finally {
      await transaction.rollback();
    }
  });
});
