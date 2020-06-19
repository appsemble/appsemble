import { logger } from '@appsemble/node-utils';
import { DataTypes } from 'sequelize';

import type { Migration } from '../utils/migrate';

export default {
  key: '0.13.3',

  /**
   * Summary:
   * - Query all blocks with events
   * - Parse them back into JS objects
   * - Convert all event emitters and listeners to empty objects
   */
  async up(db) {
    const queryInterface = db.getQueryInterface();
    logger.warn('Wiping all previous OAuth2AuthorizationCode instances');
    await queryInterface.bulkDelete('OAuth2AuthorizationCode', {});
    logger.info('Adding new OAuth2AuthorizationCode column scope');
    await queryInterface.addColumn('OAuth2AuthorizationCode', 'scope', {
      type: DataTypes.STRING,
      allowNull: false,
    });
  },

  async down(db) {
    const queryInterface = db.getQueryInterface();
    logger.warn('Wiping all previous OAuth2AuthorizationCode instances');
    await queryInterface.bulkDelete('OAuth2AuthorizationCode', {});
    logger.warn('Deleting OAuth2AuthorizationCode column scope');
    await queryInterface.removeColumn('OAuth2AuthorizationCode', 'scope');
  },
} as Migration;
