import idb from 'idb';


/**
 * Get an idb database for an app..
 *
 * @param {Object} app The app for which to get an idb.
 * @returns {idb.DB} An idb instance.
 */
export default function getDB(app) {
  return idb.open(`appsemble-${app.id}`, 1, (upgrade) => {
    /* eslint-disable default-case */
    switch (upgrade.oldVersion) {
      case 0:
        upgrade.createObjectStore('auth');
    }
    /* eslint-enable default-case */
  });
}
