import initial from './0.5.0-initial';

/**
 * @param {Sequelize.sequelize} pool Database connection pool
 * @param {String} key Unique ID for a migration (Ex. 20181217000005-create-table)
 * @param {Function} up Up migration function
 * @param {Function} down Down migration function
 */
export function createMigration(sequelize, dataTypes, { key, up, down }) {
  // Make sure all of the expected functions exist
  if ([up, down].some(fn => typeof fn !== 'function') || !key) {
    throw new Error(
      `Failed to create migration object (${key}).`,
      'Missing one of the required migration params: up, down, key.',
    );
  }

  // This is the API Umzug expects
  return {
    // no path since we're not importing
    path: null,
    file: key,
    up: () => up(sequelize, dataTypes),
    down: () => down(sequelize, dataTypes),
    // name filter used by Umzug to decide if it should run this migration
    testFileName: needle => {
      return key === needle;
    },
  };
}

export default [initial];
