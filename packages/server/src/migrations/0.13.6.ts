import { logger } from '@appsemble/node-utils';
import { DataTypes } from 'sequelize';

import type { Migration } from '../utils/migrate';

export default {
  key: '0.13.6',

  /**
   * Summary:
   * - Add the AppMessages table.
   */
  async up(db) {
    const queryInterface = db.getQueryInterface();
    logger.info('Adding new table AppMessages');
    await queryInterface.createTable('AppMessages', {
      AppId: {
        primaryKey: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        onDelete: 'cascade',
        onUpdate: 'cascade',
        references: {
          key: 'id',
          model: 'App',
        },
      },
      language: {
        primaryKey: true,
        type: DataTypes.STRING,
        allowNull: false,
      },
      messages: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
    });
  },

  async down(db) {
    const queryInterface = db.getQueryInterface();
    logger.warn('Dropping table AppMessages');
    await queryInterface.dropTable('AppMessages');
  },
} as Migration;
