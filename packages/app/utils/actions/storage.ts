import { type StorageType } from '@appsemble/lang-sdk';
import { Mutex } from 'async-mutex';
import { type IDBPDatabase, openDB } from 'idb';

import { type ActionCreator } from './index.js';
import { appId } from '../settings.js';
import { type AppStorage } from '../storage.js';

let dbPromise: Promise<IDBPDatabase>;

const mutexes = new Map<string, Mutex>();

async function withMutex(key: string, fn: () => Promise<void>): Promise<void> {
  const mutex = mutexes.get(key) || mutexes.set(key, new Mutex()).get(key)!;
  await mutex.runExclusive(fn);
  if (!mutex.isLocked()) {
    mutexes.delete(key);
  }
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

function readFromLocalStorage(key: string): Object | null {
  const item = localStorage.getItem(`appsemble-${appId}-${key}`);
  const value = item ? JSON.parse(item) : null;
  if (!value) {
    throw new Error('Could not find data at this key.');
  }
  const { expiry } = value;
  if (!expiry) {
    if (value?.value) {
      return value.value;
    }
    // For compatibility with the older versions.
    return value;
  }
  const now = Date.now();
  if (now > expiry) {
    localStorage.removeItem(`appsemble-${appId}-${key}`);
    return null;
  }
  return value.value;
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

    return value as Object;
  }
  if (storage !== 'indexedDB') {
    const store = storage === 'localStorage' ? localStorage : sessionStorage;
    if (storage === 'sessionStorage') {
      const value = store.getItem(`appsemble-${appId}-${key}`);
      if (!value) {
        throw new Error('Could not find data at this key.');
      }
      return JSON.parse(value);
    }
    const value = readFromLocalStorage(key);
    if (!value) {
      throw new Error('Could not find data at this key.');
    }
    return value;
  }

  const db = await getDB();
  const value = db.get('storage', key);
  if (!value) {
    throw new Error('Could not find data at this key.');
  }
  return value;
}

function writeToLocalStorage(
  key: string,
  value: string,
  expiry?: '1d' | '3d' | '7d' | '12h',
): void {
  const millisecondsInADay = 1 * 24 * 60 * 60 * 1000;
  const expiryToTimeObject = {
    '1d': millisecondsInADay,
    '3d': 3 * millisecondsInADay,
    '7d': 7 * millisecondsInADay,
    '12h': (1 / 2) * millisecondsInADay,
  };
  if (expiry && expiryToTimeObject[expiry]) {
    localStorage.setItem(
      `appsemble-${appId}-${key}`,
      JSON.stringify({ value, expiry: Date.now() + expiryToTimeObject[expiry] }),
    );
  } else {
    localStorage.setItem(`appsemble-${appId}-${key}`, JSON.stringify({ value }));
  }
}

export function writeStorage(
  storage: StorageType,
  key: string,
  value: any,
  appStorage: AppStorage,
  expiry?: '1d' | '3d' | '7d' | '12h',
): Promise<void> {
  async function write(): Promise<void> {
    switch (storage) {
      case 'appStorage':
        appStorage.set(key, value);
        break;
      case 'localStorage':
        writeToLocalStorage(key, value, expiry);
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

    const result = await readStorage(definition.storage ?? 'indexedDB', key, appStorage);
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

    const { storage = 'indexedDB' } = definition;

    withMutex(`${storage}:${key}`, () =>
      writeStorage(definition.storage ?? 'indexedDB', key, value, appStorage, definition.expiry),
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

    deleteStorage(definition.storage ?? 'indexedDB', key, appStorage);
    return data;
  },
];

export const append: ActionCreator<'storage.append'> = ({ appStorage, definition, remap }) => [
  async (data, context) => {
    const key = remap(definition.key, data, context);
    if (!key) {
      return data;
    }

    const { storage = 'indexedDB' } = definition;

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

    const { storage = 'indexedDB' } = definition;

    await withMutex(`${storage}:${key}`, async () => {
      let storageData: Object | Object[] | null = await readStorage(storage, key, appStorage);
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

    const { storage = 'indexedDB' } = definition;

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
