import { randomUUID } from 'crypto';

import { AppsembleError, logger } from '@appsemble/node-utils';
import { DataTypes, QueryTypes, Sequelize } from 'sequelize';

export const key = '0.18.0';

/**
 * Summary:
 * - Add BlockMessages table
 * - Add id to BlockVersion
 * - Add BlockVersionId to BlockAsset
 * - Add unique constraint of OrganizationId, name, version to BlockVersion
 * - Change content and filename in BlockAsset to be non-nullable
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Fetching block versions and generating new IDs');
  const versions = (
    await db.query<{ name: string; OrganizationId: string; version: string }>(
      'SELECT "OrganizationId", version, name FROM "BlockVersion"',
      { raw: true, type: QueryTypes.SELECT },
    )
  ).map((version) => ({ ...version, id: randomUUID() }));

  logger.info('Adding column id to BlockVersion');
  await queryInterface.addColumn('BlockVersion', 'id', {
    type: DataTypes.UUID,
    allowNull: true,
  });

  logger.info('Adding column BlockVersionId to BlockAsset');
  await queryInterface.addColumn('BlockAsset', 'BlockVersionId', {
    type: DataTypes.UUID,
    allowNull: true,
  });

  logger.info('Setting IDs to BlockVersion.id and BlockAsset.BlockVersionId');
  await Promise.all(
    versions.flatMap((version) => [
      db.query(
        'UPDATE "BlockVersion" SET id = ? WHERE "OrganizationId" = ? AND name = ? AND version = ?',
        { replacements: [version.id, version.OrganizationId, version.name, version.version] },
      ),
      db.query(
        'UPDATE "BlockAsset" SET "BlockVersionId" = ? WHERE "OrganizationId" = ? AND name = ? AND version = ?',
        { replacements: [version.id, version.OrganizationId, version.name, version.version] },
      ),
    ]),
  );

  logger.info('Dropping primary key from BlockVersion');
  await queryInterface.removeConstraint('BlockVersion', 'BlockVersion_pkey');

  logger.info('Dropping foreign key from BlockAsset');
  await queryInterface.removeConstraint('BlockAsset', 'BlockAsset_OrganizationId_fkey');

  logger.info('Assigning BlockVersion.id as primary key');
  await queryInterface.changeColumn('BlockVersion', 'id', {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    primaryKey: true,
  });
  await queryInterface.addConstraint('BlockVersion', {
    type: 'primary key',
    fields: ['id'],
    name: 'BlockVersion_pkey',
  });

  try {
    logger.info('Removing unique constraint BlockVersion_name_version_key');
    await queryInterface.removeConstraint('BlockVersion', 'BlockVersion_name_version_key');
  } catch {
    logger.info('Constraint BlockVersion_name_version_key was not found');
  }

  logger.info('Adding unique constraint blockVersionComposite to BlockVersion');
  await queryInterface.addConstraint('BlockVersion', {
    type: 'unique',
    fields: ['OrganizationId', 'name', 'version'],
    name: 'blockVersionComposite',
  });

  logger.info('Assigning BlockAsset.BlockVersionId as foreign key');
  await queryInterface.changeColumn('BlockAsset', 'BlockVersionId', {
    type: DataTypes.UUID,
    allowNull: false,
    onDelete: 'cascade',
    onUpdate: 'cascade',
    references: {
      model: 'BlockVersion',
      key: 'id',
    },
  });

  logger.info('Removing OrganizationId, name, version from BlockAsset');
  await queryInterface.removeColumn('BlockAsset', 'OrganizationId');
  await queryInterface.removeColumn('BlockAsset', 'name');
  await queryInterface.removeColumn('BlockAsset', 'version');

  logger.info('Creating BlockMessages table');
  await queryInterface.createTable('BlockMessages', {
    BlockVersionId: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      onDelete: 'cascade',
      onUpdate: 'cascade',
      references: {
        model: 'BlockVersion',
        key: 'id',
      },
    },
    language: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    messages: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    created: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updated: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  });

  logger.info('Updating content and filename in BlockAsset to be non-nullable');
  await queryInterface.changeColumn('BlockAsset', 'content', {
    type: DataTypes.BLOB,
    allowNull: false,
  });
  await queryInterface.changeColumn('BlockAsset', 'filename', {
    type: DataTypes.STRING,
    allowNull: false,
  });
}

export function down(): Promise<void> {
  throw new AppsembleError('Due to complexity, down migrations from 0.18.0 are not supported.');
}
