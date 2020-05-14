import { DataTypes, Model, Sequelize } from 'sequelize';

import Organization from './Organization';

export default class OrganizationBlockStyle extends Model {
  OrganizationId: string;

  block: string;

  style: string;

  static initialize(sequelize: Sequelize): void {
    OrganizationBlockStyle.init(
      {
        OrganizationId: {
          type: DataTypes.STRING,
          primaryKey: true,
          allowNull: false,
          references: { model: 'Organization' },
        },
        /**
         * This refers to the organization and name of a block
         * it is agnostic of the version of the block.
         *
         * Format: @organizationName/blockName
         */
        block: {
          type: DataTypes.STRING,
          primaryKey: true,
          allowNull: false,
        },
        style: { type: DataTypes.TEXT },
      },
      {
        sequelize,
        tableName: 'OrganizationBlockStyle',
        paranoid: true,
        createdAt: 'created',
        updatedAt: 'updated',
        deletedAt: 'deleted',
      },
    );
  }

  static associate(): void {
    OrganizationBlockStyle.belongsTo(Organization, { foreignKey: 'OrganizationId' });
  }
}
