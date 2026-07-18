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
  it('should preserve database content when removing the S3 metadata columns', async () => {
    const db = getDB();
    const transaction = await db.transaction();
    try {
      await Organization.create({ id: 'org', name: 'org' }, { transaction, hooks: false });
      const version = await BlockVersion.create(
        { OrganizationId: 'org', name: 'test', version: '1.2.3' },
        { transaction, hooks: false },
      );
      const content = Buffer.from('asset');
      await BlockAsset.create(
        {
          BlockVersionId: version.id,
          content,
          filename: 'a.js',
          mime: 'application/javascript',
          size: 3,
          storageKey: 'org/test/1.2.3/hash/a.js',
        },
        { transaction, hooks: false },
      );

      await down(transaction, db);

      expect(await columnExists(db, transaction, 'storageKey')).toBe(false);
      expect(await isContentNullable(db, transaction)).toBe(false);
      const [asset] = await db.query<{ content: Buffer }>(
        'SELECT content FROM "BlockAsset" WHERE filename = :filename',
        {
          replacements: { filename: 'a.js' },
          transaction,
          type: QueryTypes.SELECT,
        },
      );
      expect(asset.content).toStrictEqual(content);
    } finally {
      await transaction.rollback();
    }
  });
});
