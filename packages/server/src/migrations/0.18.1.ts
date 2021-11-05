import { logger } from '@appsemble/node-utils';
import { DataTypes, QueryTypes, Sequelize } from 'sequelize';
import { stringify } from 'yaml';

export const key = '0.18.1';

/**
 * Summary:
 * - Create AppSnapshot table
 * - Remove yaml field from App
 *
 * @param db - The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Creating AppSnapshot table');
  await queryInterface.createTable('AppSnapshot', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    yaml: { type: DataTypes.TEXT, allowNull: false },
    AppId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      onDelete: 'cascade',
      onUpdate: 'cascade',
      references: {
        model: 'App',
        key: 'id',
      },
    },
    UserId: {
      type: DataTypes.UUID,
      references: {
        model: 'User',
        key: 'id',
      },
    },
    created: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  });

  const apps = await db.query<{ id: number; definition: Object; yaml: string }>(
    'SELECT id, definition, yaml FROM "App"',
    { type: QueryTypes.SELECT },
  );

  logger.info('Migrating yaml definitions to AppSnapshots');
  await Promise.all(
    apps.map((app) => {
      const yaml = app.yaml ?? stringify(app.definition);
      return db.query(
        'INSERT INTO "AppSnapshot" (id, yaml, "AppId", created) VALUES (DEFAULT, ?, ?, NOW())',
        {
          replacements: [yaml, app.id],
          type: QueryTypes.INSERT,
        },
      );
    }),
  );

  logger.info('Removing yaml column from App');
  await queryInterface.removeColumn('App', 'yaml');
}

/**
 * Summary:
 * - Add yaml column to App
 * - Remove all AppSnapshot
 *
 * @param db - The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding yaml column to App');
  await queryInterface.addColumn('App', 'yaml', {
    type: DataTypes.TEXT,
  });

  logger.info('Fetching all apps and inserting the most recent YAML content');
  const apps = await db.query<{ id: number }>('SELECT id FROM "App"', { type: QueryTypes.SELECT });
  await Promise.all(
    apps.map(async (app) => {
      const [{ yaml }] = await db.query<{ yaml: string }>(
        'SELECT yaml FROM "AppSnapshot" WHERE "AppId" = ? ORDER BY created DESC LIMIT 1',
        {
          replacements: [app.id],
          type: QueryTypes.SELECT,
        },
      );
      return db.query('UPDATE "App" SET yaml = ?', {
        replacements: [yaml],
        type: QueryTypes.UPDATE,
      });
    }),
  );

  logger.info('Deleting AppSnapshot table');
  await queryInterface.dropTable('AppSnapshot');
}
