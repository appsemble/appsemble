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
    const storage = definition.storage || 'idb';
    const key = remap(definition.key, data);
    if (!key) {
      return;
    }

    if (storage === 'localStorage') {
      return JSON.parse(localStorage.getItem(`appsemble-${appId}-${key}`));
    }

    if (storage === 'sessionStorage') {
      return JSON.parse(sessionStorage.getItem(`appsemble-${appId}-${key}`));
    }

    const db = await getDB();
    return db.get('storage', key);
  },
];

export const write: ActionCreator<'storage.write'> = ({ definition, remap }) => [
  async (data) => {
    const storage = definition.storage || 'idb';
    const key = remap(definition.key, data);
    if (!key) {
      return data;
    }

    const value = remap(definition.value, data);

    switch (storage) {
      case 'localStorage':
        localStorage.setItem(`appsemble-${appId}-${key}`, JSON.stringify(value));
        break;
      case 'sessionStorage':
        sessionStorage.setItem(`appsemble-${appId}-${key}`, JSON.stringify(value));
        break;
      case 'idb':
      default:
        await (await getDB()).put('storage', remap(definition.value, data), key);
    }

    return data;
  },
];
