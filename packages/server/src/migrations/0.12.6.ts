import { DataTypes } from 'sequelize';

import type { Migration } from '../utils/migrate';

export default {
  key: '0.12.6',

  /**
   * Summary:
   * - Add an icon column for block versions
   */
  async up(db) {
    const queryInterface = db.getQueryInterface();
    await queryInterface.addColumn('BlockVersion', 'icon', {
      type: DataTypes.BLOB,
      allowNull: true,
    });
  },

  async down(db) {
    const queryInterface = db.getQueryInterface();
    await queryInterface.removeColumn('BlockVersion', 'icon');
  },
} as Migration;
