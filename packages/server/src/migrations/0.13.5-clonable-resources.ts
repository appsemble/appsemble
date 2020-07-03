import { logger } from '@appsemble/node-utils';
import { DataTypes } from 'sequelize';

import type { Migration } from '../utils/migrate';

export default {
  key: '0.13.5',

  /**
   * Summary:
   * - Add clonable field to resources
   */
  async up(db) {
    const queryInterface = db.getQueryInterface();
    logger.info('Adding clonable column to Resource');
    await queryInterface.addColumn('Resource', 'clonable', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  async down(db) {
    const queryInterface = db.getQueryInterface();
    logger.warn('Removing clonable column from Resource');
    await queryInterface.removeColumn('Resource', 'clonable');
  },
} as Migration;
