import { AppsembleError } from '@appsemble/node-utils';
import { DataTypes, QueryTypes, Sequelize } from 'sequelize';

export const key = '0.12.4';

/**
 * Summary:
 * - Removes BlockDefinition
 * - Adds "OrganizationId" column with a foreign key constraint to BlockVersion and BlockAsset
 * - Adds "description" to BlockVersion
 * - Changes PK of BlockVersion to be [name, version, OrganizationId]
 * - Removes FK checks on OrganizationBlockStyle and AppBlockStyle
 * - Renames "BlockDefinitionId" in OrganizationBlockStyle and AppBlockStyle to "block"
 * - Removes the paranoid "deleted" column and "updated" columns in BlockVersion and BlockAsset
 *
 * @param db The sequelize Database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  const blockNames = await db.query<{ name: string }>('SELECT DISTINCT name FROM "BlockVersion"', {
    raw: true,
    type: QueryTypes.SELECT,
  });

  const blocks = blockNames.map(({ name: blockName }) => {
    const [organization, name] = blockName.split('/');
    return { organization: organization.slice(1), name };
  });

  await queryInterface.addColumn('BlockVersion', 'OrganizationId', {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'Organization',
      key: 'id',
    },
  });

  await queryInterface.removeColumn('BlockVersion', 'deleted');
  await queryInterface.removeColumn('BlockVersion', 'updated');
  await queryInterface.removeColumn('BlockAsset', 'deleted');
  await queryInterface.removeColumn('BlockAsset', 'updated');

  await queryInterface.addColumn('BlockAsset', 'OrganizationId', {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'Organization',
      key: 'id',
    },
  });

  // Remove foreign key and primary key constraints
  await queryInterface.removeConstraint('BlockVersion', 'BlockVersion_name_fkey');
  await queryInterface.removeConstraint('BlockVersion', 'BlockVersion_pkey');
  await queryInterface.removeConstraint('AppBlockStyle', 'AppBlockStyle_BlockDefinitionId_fkey');
  await queryInterface.removeConstraint(
    'OrganizationBlockStyle',
    'OrganizationBlockStyle_BlockDefinitionId_fkey',
  );

  // Update values of "OrganizationId" and "name"
  await Promise.all(
    blocks.map(async ({ name, organization }) => {
      await db.query('UPDATE "BlockVersion" SET "OrganizationId" = ?, "name" = ? WHERE name = ?', {
        replacements: [organization, name, `@${organization}/${name}`],
        type: QueryTypes.UPDATE,
      });
      return db.query('UPDATE "BlockAsset" SET "OrganizationId" = ?, "name" = ? WHERE name = ?', {
        replacements: [organization, name, `@${organization}/${name}`],
        type: QueryTypes.UPDATE,
      });
    }),
  );

  // Set allowNull to false now that we’ve migrated them.
  await queryInterface.changeColumn('BlockVersion', 'OrganizationId', {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'Organization',
      key: 'id',
    },
  });

  await queryInterface.changeColumn('BlockAsset', 'OrganizationId', {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'Organization',
      key: 'id',
    },
  });

  // The combination of block name, version, and organization should be unique.
  await queryInterface.addConstraint('BlockVersion', {
    fields: ['name', 'version', 'OrganizationId'],
    type: 'primary key',
    name: 'BlockVersion_pkey',
  });

  // Blocks prior to this version did not have descriptions, no need to migrate them.
  await queryInterface.addColumn('BlockVersion', 'description', {
    type: DataTypes.TEXT,
    allowNull: true,
  });

  await queryInterface.renameColumn('AppBlockStyle', 'BlockDefinitionId', 'block');
  await queryInterface.renameColumn('OrganizationBlockStyle', 'BlockDefinitionId', 'block');

  await queryInterface.dropTable('BlockDefinition');
}

export function down(): void {
  throw new AppsembleError('Due to complexity, down migrations from 0.12.0 are not supported.');
}
