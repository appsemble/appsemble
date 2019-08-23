import { App } from '@appsemble/types';
import { IDBPDatabase, openDB } from 'idb';

export const RW = 'readwrite';
export const AUTH = 'auth';

/**
 * Get an idb database for an app..
 *
 * @param app The app for which to get an idb.
 * @returns An idb instance.
 */
export default async function getDB(app: App): Promise<IDBPDatabase> {
  return openDB(`appsemble-${app.id}`, 1, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore(AUTH);
      }
    },
  });
}
