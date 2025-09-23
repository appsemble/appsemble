import { logger } from '@appsemble/node-utils';
import { type Sequelize, type Transaction } from 'sequelize';
import { Scalar, YAMLMap, YAMLSeq } from 'yaml';

import { type Patch } from '../utils/yaml.js';

export const key = '0.34.12';

/**
 * Add and remove index noop from table `App`
 *
 * @param transaction Sequelize transaction
 * @param db Sequelize database
 */
export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding index `noop` to table `App`');
  await queryInterface.addIndex('App', ['id'], { name: 'noop', transaction });

  logger.info('Removing index `noop` from table `App`');
  await queryInterface.removeIndex('App', 'noop', { transaction });
}

/**
 * Add and remove index noop from table `App`
 *
 * @param transaction Sequelize transaction
 * @param db Sequelize database
 */
export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding index `noop` to table `App`');
  await queryInterface.addIndex('App', ['id'], { name: 'noop', transaction });

  logger.info('Removing index `noop` from table `App`');
  await queryInterface.removeIndex('App', 'noop', { transaction });
}

export const appPatches: Patch[] = [
  {
    message: 'Remove layout enabledSettings property if exists',
    path: ['layout', 'enabledSettings'],
    delete: true,
  },
  {
    message: 'Add layout property if not already set',
    path: ['name'],
    patches: [
      (document) => {
        if (!document.has('layout')) {
          document.add({ key: new Scalar('layout'), value: new YAMLMap() });
        }
      },
    ],
  },
  {
    message: 'Add enabledSettings key to layout definition',
    path: ['layout'],
    add: true,
    value() {
      return { key: new Scalar('enabledSettings'), value: new YAMLSeq() };
    },
  },
  {
    message: 'Add all the settings to enabledSettings',
    path: ['layout', 'enabledSettings'],
    patches: [
      (document) => {
        if (document.hasIn(['members', 'phoneNumber'])) {
          document.addIn(['layout', 'enabledSettings'], 'phoneNumber');
        }
        if (document.hasIn(['security', 'roles'])) {
          document.addIn(['layout', 'enabledSettings'], 'name');
          document.addIn(['layout', 'enabledSettings'], 'picture');
        }
        document.addIn(['layout', 'enabledSettings'], 'languages');
      },
    ],
  },
];
