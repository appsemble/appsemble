import { AppsembleError, logger } from '@appsemble/node-utils';
import semver from 'semver';
import { type ModelStatic, type Sequelize, type Transaction } from 'sequelize';
import { type Promisable } from 'type-fest';

import { type Patch } from './yaml.js';
import { type Meta as MetaType } from '../models/index.js';

export interface Migration {
  key: string;

  up: (transaction: Transaction, db: Sequelize) => Promisable<void>;

  down: (transaction: Transaction, db: Sequelize) => Promisable<void>;

  appPatches?: Patch[];
}

async function handleMigration(
  db: Sequelize,
  migration: Migration,
  type: 'down' | 'up',
): Promise<void> {
  try {
    await db.transaction(async (t: Transaction) => {
      try {
        await migration[type](t, db);
      } catch (migrationError) {
        logger.error(`Error during migration "${migration.key}" (${type})`);
        logger.error(migrationError);
        throw migrationError;
      }
    });
  } catch (error) {
    const Meta = (db.models.Meta ?? db.models.AppMeta) as ModelStatic<MetaType>;
    const [meta] = await Meta.findAll();
    const prefix = type === 'up' ? 'Upgrade to' : 'Downgrade from';
    if (!meta) {
      logger.warn(
        `${prefix} ${migration.key} unsuccessful, not committing. Please make sure to start from an empty database.`,
      );
      throw error;
    }
    logger.warn(
      `${prefix} ${migration.key} unsuccessful, not committing. Current database version ${meta.version}.`,
    );
    logger.warn(
      `In case this occurred on a hosted Appsemble instance,
and the logs above do not contain warnings to resolve the below error manually,
consider contacting \`support@appsemble.com\` to report the migration issue,
and include the stacktrace.`,
    );
    throw error;
  }
}

export async function migrate(
  db: Sequelize,
  toVersion: string,
  migrations: Migration[],
): Promise<void> {
  const dbName = db.getDatabaseName();
  const Meta = (db.models.Meta ?? db.models.AppMeta) as ModelStatic<MetaType>;
  await Meta.sync();
  const to = toVersion === 'next' ? migrations.at(-1)!.key : toVersion;
  const metas = await Meta.findAll();
  if (metas.length > 1) {
    throw new AppsembleError(
      `Multiple Meta entries found. The ${dbName} database requires a manual fix.`,
    );
  }
  let meta: MetaType;
  if (metas.length === 0) {
    logger.warn(`No old database meta information was found for database ${dbName}.`);
    const [first, ...migrationsToApply] = migrations.filter(({ key }) => semver.lte(key, to));
    logger.info(`Upgrade to ${first.key} started for database ${dbName}.`);
    await handleMigration(db, first, 'up');
    meta = await Meta.create({ version: first.key });
    for (const migration of migrationsToApply) {
      logger.info(`Upgrade to ${migration.key} started for database ${dbName}.`);
      await handleMigration(db, migration, 'up');
      [, [meta]] = await Meta.update({ version: migration.key }, { returning: true, where: {} });
      logger.info(`Upgrade to ${migration.key} successful for database ${dbName}.`);
    }
    return;
  }
  [meta] = metas;
  if (semver.eq(to, meta.version)) {
    logger.info(`Database ${dbName} is already on version ${to}. Nothing to migrate.`);
    return;
  }
  logger.info(`Current ${dbName} database version: ${meta.version}`);
  if (semver.gt(to, meta.version)) {
    const migrationsToApply = migrations.filter(
      ({ key }) => semver.gt(key, meta.version) && semver.lte(key, to),
    );
    for (const migration of migrationsToApply) {
      logger.info(`Upgrade to ${migration.key} started for database ${dbName}.`);
      await handleMigration(db, migration, 'up');
      await Meta.update({ version: migration.key }, { where: {} });
      logger.info(`Upgrade to ${migration.key} successful for database ${dbName}.`);
    }
  } else {
    const migrationsToApply = migrations
      .filter(({ key }) => semver.lte(key, meta.version) && semver.gt(key, to))
      .reverse();
    for (const migration of migrationsToApply) {
      logger.info(`Downgrade from ${migration.key} started for database ${dbName}.`);
      const migrationIndex = migrations.lastIndexOf(migration);
      const version = migrationIndex ? migrations[migrationIndex - 1].key : '0.0.0';
      await handleMigration(db, migration, 'down');
      await Meta.update({ version }, { where: {} });
      logger.info(`Downgrade from ${migration.key} successful for database ${dbName}.`);
    }
  }
}

export function logDBDebugInstructions(db: Sequelize): void {
  const { host, password, port, username } = db.config;
  logger.info(`Use the following command to connect to the test database for further debugging:

psql postgres://${username}:${password}@${host}:${port}/${db.getDatabaseName()}`);
}
