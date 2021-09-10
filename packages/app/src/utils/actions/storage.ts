import { IDBPDatabase, openDB } from 'idb';

import { ActionCreator } from '.';
import { appId } from '../settings';

let db: IDBPDatabase;

async function getDB(): Promise<IDBPDatabase> {
  if (!db) {
    db = await openDB(`app-${appId}`, 1, {
      upgrade(d) {
        d.createObjectStore('storage');
      },
    });
  }

  return db;
}

export const read: ActionCreator<'storage.read'> = ({ definition, remap }) => [
  async (data) => {
    const key = remap(definition.key, data);
    if (!key) {
      return;
    }

    return (await getDB()).get('storage', key);
  },
];

export const write: ActionCreator<'storage.write'> = ({ definition, remap }) => [
  async (data) => {
    const key = remap(definition.key, data);
    if (!key) {
      return data;
    }

    await (await getDB()).put('storage', remap(definition.value, data), key);
    return data;
  },
];
