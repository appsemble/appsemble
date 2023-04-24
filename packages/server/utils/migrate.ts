import { AppsembleError, logger } from '@appsemble/node-utils';
import semver from 'semver';
import { type Sequelize } from 'sequelize';
import { type Promisable } from 'type-fest';

import { getDB, Meta } from '../models/index.js';

export interface Migration {
  key: string;

  up: (db: Sequelize) => Promisable<void>;

  down: (db: Sequelize) => Promisable<void>;
}

export async function migrate(toVersion: string, migrations: Migration[]): Promise<void> {
  const db = getDB();
  await Meta.sync();
  const to = toVersion === 'next' ? migrations[migrations.length - 1].key : toVersion;
  const metas = await Meta.findAll();
  if (metas.length > 1) {
    throw new AppsembleError('Multiple Meta entries found. The database requires a manual fix.');
  }
  let meta: Meta;
  if (metas.length === 0) {
    logger.warn('No old database meta information was found.');
    logger.info('Synchronizing database models as-is.');
    await db.sync();
    meta = await Meta.create({ version: migrations[migrations.length - 1].key });
  } else {
    [meta] = metas;
  }
  if (semver.eq(to, meta.version)) {
    logger.info(`Database is already on version ${to}. Nothing to migrate.`);
    return;
  }
  logger.info(`Current database version: ${meta.version}`);
  if (semver.gt(to, meta.version)) {
    const f = migrations.filter(({ key }) => semver.gt(key, meta.version) && semver.lte(key, to));
    for (const migration of f) {
      logger.info(`Upgrade to ${migration.key} started`);
      await migration.up(db);
      await Meta.update({ version: migration.key }, { where: {} });
      logger.info(`Upgrade to ${migration.key} successful`);
    }
  } else {
    const f = migrations
      .filter(({ key }) => semver.lte(key, meta.version) && semver.gt(key, to))
      .reverse();
    for (const migration of f) {
      logger.info(`Downgrade from ${migration.key} started`);
      const migrationIndex = migrations.lastIndexOf(migration);
      const version = migrationIndex ? migrations[migrationIndex - 1].key : '0.0.0';
      await migration.down(db);
      await Meta.update({ version }, { where: {} });
      logger.info(`Downgrade from ${migration.key} successful`);
    }
  }
}
