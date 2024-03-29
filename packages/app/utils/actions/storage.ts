import { type StorageType } from '@appsemble/types';
import { Mutex } from 'async-mutex';
import { type IDBPDatabase, openDB } from 'idb';

import { type ActionCreator } from './index.js';
import { appId } from '../settings.js';
import { type AppStorage } from '../storage.js';

let dbPromise: Promise<IDBPDatabase>;

const mutexes = new Map<string, Mutex>();

function withMutex(key: string, fn: () => Promise<void>): Promise<void> {
  const mutex = mutexes.get(key) || mutexes.set(key, new Mutex()).get(key);
  return mutex.runExclusive(fn).then(() => {
    if (!mutex.isLocked()) {
      mutexes.delete(key);
    }
  });
}

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

export async function readStorage(
  storageType: StorageType,
  key: string,
  appStorage: AppStorage,
): Promise<Object> {
  const storage = storageType || 'indexedDB';

  if (storage === 'appStorage') {
    let value = appStorage.get(key);

    if (value === undefined) {
      throw new Error('Could not find data at this key.');
    }

    // Re-assign value to prevent referential equality search issues
    if (typeof value === 'object') {
      value = Array.isArray(value) ? [...value] : { ...value };
    }

    return value;
  }
  if (storage !== 'indexedDB') {
    const store = storage === 'localStorage' ? localStorage : sessionStorage;
    const value = store.getItem(`appsemble-${appId}-${key}`);
    if (!value) {
      throw new Error('Could not find data at this key.');
    }
    return JSON.parse(value);
  }

  const db = await getDB();
  const value = db.get('storage', key);
  if (!value) {
    throw new Error('Could not find data at this key.');
  }
  return value;
}

export function writeStorage(
  storage: StorageType,
  key: string,
  value: any,
  appStorage: AppStorage,
): Promise<void> {
  async function write(): Promise<void> {
    switch (storage) {
      case 'appStorage':
        appStorage.set(key, value);
        break;
      case 'localStorage':
        localStorage.setItem(`appsemble-${appId}-${key}`, JSON.stringify(value));
        break;
      case 'sessionStorage':
        sessionStorage.setItem(`appsemble-${appId}-${key}`, JSON.stringify(value));
        break;
      default: {
        const db = await getDB();
        await db.put('storage', value, key);
      }
    }
  }
  return write();
}

export function deleteStorage(storage: StorageType, key: string, appStorage: AppStorage): void {
  async function remove(): Promise<void> {
    switch (storage) {
      case 'appStorage':
        appStorage.remove(key);
        break;
      case 'localStorage':
        localStorage.removeItem(`appsemble-${appId}-${key}`);
        break;
      case 'sessionStorage':
        sessionStorage.removeItem(`appsemble-${appId}-${key}`);
        break;
      default: {
        const db = await getDB();
        await db.delete('storage', key);
      }
    }
  }
  remove();
}

export const read: ActionCreator<'storage.read'> = ({ appStorage, definition, remap }) => [
  async (data, context) => {
    const key = remap(definition.key, data, context);
    if (!key) {
      return;
    }

    const result = await readStorage(definition.storage, key, appStorage);
    return result;
  },
];

export const write: ActionCreator<'storage.write'> = ({ appStorage, definition, remap }) => [
  (data, context) => {
    const key = remap(definition.key, data, context);
    if (!key) {
      return data;
    }

    const value = remap(definition.value, data, context);

    withMutex(`${definition.storage}:${key}`, () =>
      writeStorage(definition.storage, key, value, appStorage),
    );

    return data;
  },
];

export const remove: ActionCreator<'storage.delete'> = ({ appStorage, definition, remap }) => [
  (data, context) => {
    const key = remap(definition.key, data, context);
    if (!key) {
      return data;
    }

    deleteStorage(definition.storage, key, appStorage);
    return data;
  },
];

export const append: ActionCreator<'storage.append'> = ({ appStorage, definition, remap }) => [
  async (data, context) => {
    const key = remap(definition.key, data, context);
    if (!key) {
      return data;
    }

    const { storage } = definition;

    const value = remap(definition.value, data, context);

    await withMutex(`${storage}:${key}`, async () => {
      let storageData: Object | Object[] = await readStorage(storage, key, appStorage);
      if (Array.isArray(storageData)) {
        storageData.push(value);
      } else {
        storageData = [storageData, value];
      }
      return writeStorage(storage, key, storageData, appStorage);
    });

    return data;
  },
];

export const subtract: ActionCreator<'storage.subtract'> = ({ appStorage, definition, remap }) => [
  async (data, context) => {
    const key = remap(definition.key, data, context);
    if (!key) {
      return data;
    }

    const { storage } = definition;

    await withMutex(`${storage}:${key}`, async () => {
      let storageData: Object | Object[] = await readStorage(storage, key, appStorage);
      if (Array.isArray(storageData)) {
        const last = storageData.pop();
        if (storageData.length <= 1) {
          storageData = last;
        }
      } else {
        storageData = null;
      }

      if (storageData == null) {
        deleteStorage(storage, key, appStorage);
      } else {
        return writeStorage(storage, key, storageData, appStorage);
      }
    });

    return data;
  },
];

export const update: ActionCreator<'storage.update'> = ({ appStorage, definition, remap }) => [
  async (data, context) => {
    const key = remap(definition.key, data, context);
    const item = remap(definition.item, data, context);
    const value = remap(definition.value, data, context);
    if (!key) {
      return data;
    }

    const { storage } = definition;

    await withMutex(`${storage}:${key}`, async () => {
      let storageData: Object | Object[] = await readStorage(storage, key, appStorage);
      if (Array.isArray(storageData)) {
        storageData[item as number] = value;
      } else {
        storageData = value;
      }
      return writeStorage(storage, key, storageData, appStorage);
    });

    return data;
  },
];
