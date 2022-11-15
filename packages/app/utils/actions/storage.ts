import { IDBPDatabase, openDB } from 'idb';

import { appId } from '../settings.js';
import { ActionCreator } from './index.js';

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

export const append: ActionCreator<'storage.append'> = ({ definition, remap }) => [
  async (data) => {
    let storageData: Object | Object[];
    const key = remap(definition.key, data);
    if (!key) {
      return data;
    }

    const { storage } = definition;

    switch (true) {
      case storage !== 'indexedDB': {
        const store = storage === 'localStorage' ? localStorage : sessionStorage;
        const value = store.getItem(`appsemble-${appId}-${key}`);
        storageData = JSON.parse(value);
        break;
      }
      default: {
        const db = await getDB();
        storageData = db.get('storage', key);
      }
    }

    if (storageData == null) {
      throw new Error('Could not find any data to append onto!');
    }

    const value = remap(definition.value, data);

    if (Array.isArray(storageData)) {
      storageData.push(value);
    } else {
      const storageArray: Object[] = [];
      storageArray.push(storageData, value);
      storageData = storageArray;
    }

    switch (storage) {
      case 'localStorage':
        localStorage.setItem(`appsemble-${appId}-${key}`, JSON.stringify(storageData));
        break;
      case 'sessionStorage':
        sessionStorage.setItem(`appsemble-${appId}-${key}`, JSON.stringify(storageData));
        break;
      default: {
        const db = await getDB();
        await db.put('storage', remap(JSON.stringify(storageData), data), key);
      }
    }
    return data;
  },
];

export const subtract: ActionCreator<'storage.subtract'> = ({ definition, remap }) => [
  async (data) => {
    let storageData: Object | Object[];
    const key = remap(definition.key, data);
    if (!key) {
      return data;
    }

    const { storage } = definition;

    switch (true) {
      case storage !== 'indexedDB': {
        const store = storage === 'localStorage' ? localStorage : sessionStorage;
        const value = store.getItem(`appsemble-${appId}-${key}`);
        storageData = JSON.parse(value);
        break;
      }
      default: {
        const db = await getDB();
        storageData = db.get('storage', key);
      }
    }

    if (storageData == null) {
      throw new Error('Could not find any data to subtract from!');
    }

    if (Array.isArray(storageData)) {
      storageData.pop();
      if (storageData.length <= 1) {
        const [storageObject] = storageData;
        storageData = storageObject;
      }
    } else {
      storageData = null;
    }

    switch (storage) {
      case 'localStorage':
        localStorage.setItem(`appsemble-${appId}-${key}`, JSON.stringify(storageData));
        if (storageData == null) {
          localStorage.removeItem(`appsemble-${appId}-${key}`);
        }
        break;
      case 'sessionStorage':
        sessionStorage.setItem(`appsemble-${appId}-${key}`, JSON.stringify(storageData));
        if (storageData == null) {
          sessionStorage.removeItem(`appsemble-${appId}-${key}`);
        }
        break;
      default: {
        const db = await getDB();
        await db.put('storage', remap(JSON.stringify(storageData), data), key);
        if (storageData == null) {
          db.delete('storage', key);
        }
      }
    }

    return data;
  },
];
