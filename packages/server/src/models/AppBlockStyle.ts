import { DataTypes, Model, Sequelize } from 'sequelize';

import App from './App';

export default class AppBlockStyle extends Model {
  AppId: number;

  block: string;

  style: string;

  static initialize(sequelize: Sequelize): void {
    AppBlockStyle.init(
      {
        AppId: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          allowNull: false,
          references: { model: 'App' },
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
        tableName: 'AppBlockStyle',
        // XXX: Setting this to true causes issues with the test truncate() function.
        paranoid: false,
        createdAt: 'created',
        updatedAt: 'updated',
        deletedAt: 'deleted',
      },
    );
  }

  static associate(): void {
    AppBlockStyle.belongsTo(App);
  }
}
