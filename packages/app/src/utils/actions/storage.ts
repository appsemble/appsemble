import { IDBPDatabase, openDB } from 'idb';

import { ActionCreator } from '.';
import { appId } from '../settings';

let dbPromise: Promise<IDBPDatabase>;

export function getDB(): Promise<IDBPDatabase> {
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

    const storage = definition.storage || 'indexedDB';
    if (storage !== 'indexedDB') {
      const store = storage === 'localStorage' ? localStorage : sessionStorage;
      const value = store.getItem(`appsemble-${appId}-${key}`);
      if (!value) {
        return;
      }
      try {
        return JSON.parse(value);
      } catch {
        // Invalid data may be stored due to various reasons. In that case pretend there is no data.
        return;
      }
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

    const value = remap(definition.value, data);

    switch (definition.storage) {
      case 'localStorage':
        localStorage.setItem(`appsemble-${appId}-${key}`, JSON.stringify(value));
        break;
      case 'sessionStorage':
        sessionStorage.setItem(`appsemble-${appId}-${key}`, JSON.stringify(value));
        break;
      default: {
        const db = await getDB();
        await db.put('storage', remap(definition.value, data), key);
      }
    }

    return data;
  },
];
