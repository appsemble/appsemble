import { IDBPDatabase, openDB } from 'idb';

export const RW = 'readwrite';
export const AUTH = 'auth';

/**
 * Get an idb database for an app..
 *
 * @param app The app for which to get an idb.
 * @returns An idb instance.
 */
export default async function getDB(): Promise<IDBPDatabase> {
  return openDB('appsemble', 1, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore(AUTH);
      }
    },
  });
}
