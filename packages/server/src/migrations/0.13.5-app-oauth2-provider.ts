import { logger } from '@appsemble/node-utils';
import { DataTypes } from 'sequelize';

import type { Migration } from '../utils/migrate';

export default {
  key: '0.13.5',

  /**
   * Summary:
   * - Add the AppOAuth2Secret table.
   * - Add the AppOAuth2Authorization table.
   */
  async up(db) {
    const queryInterface = db.getQueryInterface();
    logger.info('Adding new table AppOAuth2Secret');
    await queryInterface.createTable('AppOAuth2Secret', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      authorizationUrl: { type: DataTypes.STRING, allowNull: false },
      tokenUrl: { type: DataTypes.STRING, allowNull: false },
      userInfoUrl: { type: DataTypes.STRING },
      clientId: { type: DataTypes.STRING, allowNull: false },
      clientSecret: { type: DataTypes.STRING, allowNull: false },
      icon: { type: DataTypes.STRING, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      scope: { type: DataTypes.STRING, allowNull: false },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
      AppId: { type: DataTypes.NUMBER, allowNull: false },
    });
    await queryInterface.addConstraint('AppOAuth2Secret', ['AppId'], {
      type: 'foreign key',
      name: 'AppOAuth2Secret_AppId_fkey',
      onDelete: 'cascade',
      onUpdate: 'cascade',
      references: { table: 'App', field: 'id' },
    });

    logger.info('Adding new table AppOAuth2Authorization');
    await queryInterface.createTable('AppOAuth2Authorization', {
      sub: { type: DataTypes.STRING, primaryKey: true },
      AppOAuth2SecretId: { type: DataTypes.INTEGER, primaryKey: true },
      accessToken: { type: DataTypes.STRING, allowNull: false },
      expires: { type: DataTypes.DATE },
      refreshToken: { type: DataTypes.STRING },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
      UserId: { type: DataTypes.UUID, allowNull: false },
    });
    await queryInterface.addConstraint('AppOAuth2Authorization', ['AppId'], {
      type: 'foreign key',
      name: 'AppOAuth2Authorization_AppId_fkey',
      onDelete: 'cascade',
      onUpdate: 'cascade',
      references: { table: 'App', field: 'id' },
    });
    await queryInterface.addConstraint('AppOAuth2Authorization', ['UserId'], {
      type: 'foreign key',
      name: 'AppOAuth2Authorization_UserId_fkey',
      onDelete: 'cascade',
      onUpdate: 'cascade',
      references: { table: 'User', field: 'id' },
    });
  },

  async down(db) {
    const queryInterface = db.getQueryInterface();
    logger.warn('Dropping table AppOAuth2Authorization');
    await queryInterface.dropTable('AppOAuth2Authorization');

    logger.warn('Dropping table AppOAuth2Secret');
    await queryInterface.dropTable('AppOAuth2Secret');
  },
} as Migration;
