import { DataTypes, QueryTypes } from 'sequelize';
import { describe, expect, it } from 'vitest';

import { down, up } from './0.40.2.js';
import { getDB, TrainingCompleted, User } from '../../models/index.js';

describe('migration 0.40.2', () => {
  it('should preserve completion history while removing and restoring the catalog table', async () => {
    const db = getDB();
    const transaction = await db.transaction();
    try {
      const queryInterface = db.getQueryInterface();
      await queryInterface.createTable(
        'Training',
        {
          id: { type: DataTypes.STRING, primaryKey: true },
          created: { allowNull: false, type: DataTypes.DATE },
          updated: { allowNull: false, type: DataTypes.DATE },
        },
        { transaction },
      );
      await queryInterface.addConstraint('TrainingCompleted', {
        fields: ['TrainingId'],
        name: 'TrainingCompleted_TrainingId_fkey',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        references: { field: 'id', table: 'Training' },
        transaction,
        type: 'foreign key',
      });

      const user = await User.create({ timezone: 'Europe/Amsterdam' }, { transaction });
      await db.query(
        `INSERT INTO "Training" (id, created, updated)
         VALUES ('what-is-appsemble', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        { transaction },
      );
      await TrainingCompleted.create(
        { TrainingId: 'what-is-appsemble', UserId: user.id },
        { transaction },
      );

      await up(transaction, db);

      const [removedTable] = await db.query<{ tableName: string | null }>(
        'SELECT to_regclass(\'"Training"\') AS "tableName"',
        { transaction, type: QueryTypes.SELECT },
      );
      expect(removedTable.tableName).toBeNull();
      expect(await TrainingCompleted.count({ transaction })).toBe(1);

      await TrainingCompleted.create(
        { TrainingId: 'removed-training', UserId: user.id },
        { transaction },
      );
      await down(transaction, db);

      const catalog = await db.query<{ id: string }>('SELECT id FROM "Training" ORDER BY id', {
        transaction,
        type: QueryTypes.SELECT,
      });
      expect(catalog.map(({ id }) => id)).toStrictEqual(['removed-training', 'what-is-appsemble']);
      expect(await TrainingCompleted.count({ transaction })).toBe(2);
    } finally {
      await transaction.rollback();
    }
  });
});
