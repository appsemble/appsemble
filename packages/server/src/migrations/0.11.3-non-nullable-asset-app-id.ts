import { DataTypes } from 'sequelize';

import type { Migration } from '../utils/migrate';

export default {
  key: '0.11.3',

  async up(db) {
    const queryInterface = db.getQueryInterface();
    await queryInterface.changeColumn('Asset', 'AppId', {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'App',
        key: 'id',
      },
    });
  },

  async down(db) {
    const queryInterface = db.getQueryInterface();
    await queryInterface.changeColumn('Asset', 'AppId', {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'App',
        key: 'id',
      },
    });
  },
} as Migration;
