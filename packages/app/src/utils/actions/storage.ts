import { IDBPDatabase, openDB } from 'idb';

import { ActionCreator } from '.';
import { appId } from '../settings';


let dbPromise: Promise<IDBPDatabase>;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(`appsemble-${appId}`, 1, {
      upgrade(d) {
        d.createObjectStore('storage');
      },
    });
  }

  return dbPromise;
}

export const read: ActionCreator<'storage.read'> = ({ definition, remap }) => [
  async (data) => {
    const key = remap(definition.key, data);
    if (!key) {
      return;
    }

    const db = await getDB();
    return db.get('storage', key);
  },
];

export const write: ActionCreator<'storage.write'> = ({ definition, remap }) => [
  async (data) => {
    const key = remap(definition.key, data);
    if (!key) {
      return data;
    }

    const db = await getDB();
    await db.put('storage', remap(definition.value, data), key);
    return data;
  },
];
