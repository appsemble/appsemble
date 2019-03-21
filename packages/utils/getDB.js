import { openDb } from 'idb';

export const RW = 'readwrite';
export const AUTH = 'auth';

/**
 * Get an idb database for an app..
 *
 * @param {Object} app The app for which to get an idb.
 * @returns {idb.DB} An idb instance.
 */
export default function getDB(app) {
  return openDb(`appsemble-${app.id}`, 1, upgrade => {
    // eslint-disable-next-line default-case
    switch (upgrade.oldVersion) {
      case 0:
        upgrade.createObjectStore(AUTH);
    }
  });
}
