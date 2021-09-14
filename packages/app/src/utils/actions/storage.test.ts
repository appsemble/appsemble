import { IDBPDatabase } from 'idb';

import { createTestAction } from '../makeActions';
import { getDB } from './storage';

let db: IDBPDatabase;

beforeEach(async () => {
  db = await getDB();

  db.put('storage', 'This is default test data!', 'data');
});

describe('storage.read', () => {
  it('should read from the store', async () => {
    const action = createTestAction({
      definition: { type: 'storage.read', key: { prop: 'test' } },
    });
    const result = await action({ test: 'data' });
    expect(result).toStrictEqual('This is default test data!');
  });

  it('should return undefined for unknown keys in the store', async () => {
    const action = createTestAction({
      definition: { type: 'storage.read', key: { prop: 'test' } },
    });
    const result = await action({ test: 'bla' });
    expect(result).toBeUndefined();
  });
});

describe('storage.write', () => {
  it('should store data', async () => {
    const action = createTestAction({
      definition: { type: 'storage.write', key: { prop: 'key' }, value: { prop: 'data' } },
    });
    const data = {
      key: 'key',
      data: { this: 'is', 0: 'some', arbitrary: { data: 'storage' } },
      date: new Date(),
    };
    const result = await action({
      key: 'key',
      data,
    });
    expect(result).toStrictEqual({ key: 'key', data });
    expect(await db.get('storage', 'key')).toStrictEqual(data);
  });
});
