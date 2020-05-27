import { DataTypes } from 'sequelize';

import type { Migration } from '../utils/migrate';

/**
 * Summary:
 * - Add `longDescription` column to `BlockVersion`.
 */
export default {
  key: '0.13.2',

  async up(db) {
    const queryInterface = db.getQueryInterface();
    await queryInterface.addColumn('BlockVersion', 'longDescription', { type: DataTypes.TEXT });
  },

  async down(db) {
    const queryInterface = db.getQueryInterface();
    await queryInterface.removeColumn('BlockVersion', 'longDescription');
  },
} as Migration;
