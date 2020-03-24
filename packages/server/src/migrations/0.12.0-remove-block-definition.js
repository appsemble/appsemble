import { DataTypes } from 'sequelize';

export default {
  key: '0.12.0',

  /**
   * Summary:
   * - Removes BlockDefinition
   * - Adds "OrganizationId" column with a foreign key constraint to BlockVersion and BlockAsset
   * - Adds "description" to BlockVersion
   * - Changes PK of BlockVersion to be [name, version, OrganizationId]
   * - Removes FK checks on OrganizationBlockStyle and AppBlockStyle
   * - Renames "BlockDefinitionId" in OrganizationBlockStyle and AppBlockStyle to "block"
   * - Removes the paranoid "deleted" column in BlockVersion
   */
  async up(db) {
    const queryInterface = db.getQueryInterface();
    const blockNames = await db.query('SELECT DISTINCT name FROM "BlockVersion"', {
      raw: true,
      type: db.QueryTypes.SELECT,
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
        await db.query(
          'UPDATE "BlockVersion" SET "OrganizationId" = ?, "name" = ? WHERE name = ?',
          {
            replacements: [organization, name, `@${organization}/${name}`],
            type: db.QueryTypes.UPDATE,
          },
        );
        return db.query('UPDATE "BlockAsset" SET "OrganizationId" = ?, "name" = ? WHERE name = ?', {
          replacements: [organization, name, `@${organization}/${name}`],
          type: db.QueryTypes.UPDATE,
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
    await queryInterface.addConstraint('BlockVersion', ['name', 'version', 'OrganizationId'], {
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
  },

  // eslint-disable-next-line no-unused-vars
  async down(db) {
    // Not fully implemented due to complexity.
    // const queryInterface = db.getQueryInterface();
    // const blockNames = await db.query(
    //   'SELECT DISTINCT "name", "OrganizationId" FROM "BlockVersion"',
    //   {
    //     raw: true,
    //     type: db.QueryTypes.SELECT,
    //   },
    // );
    // const names = new Set();
    // blockNames.forEach(({ OrganizationId, name }) => {
    //   names.add(`@${OrganizationId}/${name}`);
    // });
    // await queryInterface.createTable('BlockDefinition', {
    //   id: { type: DataTypes.STRING, primaryKey: true },
    //   description: { type: DataTypes.STRING },
    //   created: { allowNull: false, type: DataTypes.DATE },
    //   updated: { allowNull: false, type: DataTypes.DATE },
    //   deleted: { allowNull: true, type: DataTypes.DATE },
    // });
    // await Promise.all(
    //   blockNames.map(async blockName => {
    //     await db.query(
    //       'INSERT INTO "BlockDefinition"(id, name, created, updated)
    //        VALUES (DEFAULT, ?, NOW(), NOW())',
    //       {
    //         replacements: [blockName],
    //         type: db.QueryTypes.INSERT,
    //       },
    //     );
    //     const [organizationId, name] = blockName.split('/');
    //     return db.query(
    //       'UPDATE "BlockAsset" SET "name" = ?, WHERE name = ? AND "OrganizationId" = ?',
    //       {
    //         replacements: [blockName, organizationId.slice(1), name],
    //         type: db.QueryTypes.UPDATE,
    //       },
    //     );
    //   }),
    // );
    // await queryInterface.renameColumn('AppBlockStyle', 'block', 'BlockDefinitionId');
    // await queryInterface.renameColumn('OrganizationBlockStyle', 'block', 'BlockDefinitionId');
    // await queryInterface.removeColumn('BlockVersion', 'description');
    // await queryInterface.addConstraint('AppBlockStyle', ['BlockDefinitionId'], {
    //   type: 'foreign key',
    //   name: 'AppBlockStyle_BlockDefinitionId_fkey',
    //   references: {
    //     table: 'BlockDefinition',
    //     field: 'id',
    //   },
    // });
    // await queryInterface.addConstraint('OrganizationBlockStyle', ['BlockDefinitionId'], {
    //   type: 'foreign key',
    //   name: 'OrganizationBlockStyle_BlockDefinitionId_fkey',
    //   references: {
    //     table: 'BlockDefinition',
    //     field: 'id',
    //   },
    // });
    // await queryInterface.removeConstraint('BlockVersion', 'BlockVersion_pkey');
    // await queryInterface.addConstraint('BlockVersion', ['name', 'version'], {
    //   type: 'primary key',
    //   name: 'BlockVersion_pkey',
    // });
    // await queryInterface.addConstraint('BlockVersion', ['name'], {
    //   type: 'foreign key',
    //   name: 'BlockVersion_name_fkey',
    //   references: {
    //     table: 'BlockDefinition',
    //     field: 'id',
    //   },
    // });
  },
};
