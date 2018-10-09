import idb from 'idb';

export const RW = 'readwrite';
export const AUTH = 'auth';

/**
 * Get an idb database for an app..
 *
 * @param {Object} app The app for which to get an idb.
 * @returns {idb.DB} An idb instance.
 */
export default function getDB(app) {
  return idb.open(`appsemble-${app.id}`, 1, upgrade => {
    /* eslint-disable default-case */
    switch (upgrade.oldVersion) {
      case 0:
        upgrade.createObjectStore(AUTH);
    }
    /* eslint-enable default-case */
  });
}
