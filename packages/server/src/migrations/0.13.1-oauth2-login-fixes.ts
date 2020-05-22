import { AppsembleError } from '@appsemble/node-utils';
import { DataTypes, QueryTypes } from 'sequelize';
import { v4 } from 'uuid';

import type { Migration } from '../utils/migrate';

export default {
  key: '0.13.1',

  /**
   * Summary:
   * - Rename id to sub
   * - Rename token to accessToken
   * - Rename provider to authorizationUrl
   *
   * Data hasn’t been migrated, because there is no data in this table in production. The table is
   * wiped, just to be sure.
   */
  async up(db) {
    const queryInterface = db.getQueryInterface();

    await queryInterface.bulkDelete('OAuthAuthorization', {});
    await queryInterface.renameColumn('OAuthAuthorization', 'id', 'sub');
    await queryInterface.renameColumn('OAuthAuthorization', 'token', 'accessToken');
    await queryInterface.renameColumn('OAuthAuthorization', 'provider', 'authorizationUrl');
  },

  async down(db) {
    const queryInterface = db.getQueryInterface();

    await queryInterface.bulkDelete('OAuthAuthorization', {});
    await queryInterface.renameColumn('OAuthAuthorization', 'sub', 'id');
    await queryInterface.renameColumn('OAuthAuthorization', 'accessToken', 'token');
    await queryInterface.renameColumn('OAuthAuthorization', 'authorizationUrl', 'provider');
  },
} as Migration;
