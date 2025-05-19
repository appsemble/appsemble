import { ActionError } from '@appsemble/lang-sdk';
import { type IDBPDatabase } from 'idb';
import { beforeEach, describe, expect, it } from 'vitest';

import { getDB, readStorage, writeStorage } from './storage.js';
import { createTestAction } from '../makeActions.js';
import { AppStorage } from '../storage.js';

let db: IDBPDatabase;
let appStorage: AppStorage;

beforeEach(async () => {
  db = await getDB();
  db.put('storage', 'This is default test data!', 'data');
  localStorage.setItem(
    'appsemble-42-data',
    JSON.stringify('This is default test data from localStorage!'),
  );
  sessionStorage.setItem(
    'appsemble-42-data',
    JSON.stringify('This is default test data from sessionStorage!'),
  );
  appStorage = new AppStorage();
  appStorage.set('data', 'This is default test data from appStorage!');
});

describe('storage.read', () => {
  it.each`
    storageType         | expectedResult
    ${'localStorage'}   | ${'This is default test data from localStorage!'}
    ${'sessionStorage'} | ${'This is default test data from sessionStorage!'}
    ${'indexedDB'}      | ${'This is default test data!'}
    ${'appStorage'}     | ${'This is default test data from appStorage!'}
  `('should read from $storageType', async ({ expectedResult, storageType }) => {
    const action = createTestAction({
      definition: { type: 'storage.read', key: { prop: 'test' }, storage: storageType },
      appStorage,
    });
    const result = await action({ test: 'data' });
    expect(result).toBe(expectedResult);
  });

  it('should fetch non-expired items', async () => {
    const expiry = Date.now() + 5 * 1000;
    localStorage.setItem('appsemble-42-test', JSON.stringify({ value: 'testValue', expiry }));
    const action = createTestAction({
      definition: { type: 'storage.read', key: 'test', storage: 'localStorage' },
    });
    const result = await action({});
    expect(result).toBe('testValue');
  });

  it('should not fetch expired items', async () => {
    const expiry = Date.now() - 5 * 1000;
    localStorage.setItem('appsemble-42-test', JSON.stringify({ value: 'test', expiry }));
    const action = createTestAction({
      definition: { type: 'storage.read', key: 'test', storage: 'localStorage' },
    });
    let result;
    try {
      result = await action({});
    } catch (error) {
      result = error as ActionError;
    }
    expect(result).toStrictEqual(
      new ActionError({
        cause: 'Could not find data at this key.',
        data: null,
        definition: { type: 'storage.read', key: 'test', storage: 'localStorage' },
      }),
    );
  });

  it('should return undefined for unknown keys in the store', async () => {
    const action = createTestAction({
      definition: { type: 'storage.read', key: { prop: 'test' } },
      appStorage,
    });
    const result = await action({ test: 'bla' });
    expect(result).toBeUndefined();
  });

  it('should throw error when key is not valid', async () => {
    const action = createTestAction({
      definition: { type: 'storage.read', key: { prop: 'key' }, storage: 'localStorage' },
      appStorage,
    });
    let result;

    try {
      result = await action({ key: 'invalid key' });
    } catch (error) {
      result = error as ActionError;
    }

    expect(result).toStrictEqual(
      new ActionError({
        cause: 'Could not find data at this key.',
        data: null,
        definition: { type: 'storage.read', key: { prop: 'key' }, storage: 'localStorage' },
      }),
    );
  });
});

describe('storage.write', () => {
  it.each`
    storageType
    ${'localStorage'}
    ${'sessionStorage'}
    ${'indexedDB'}
    ${'appStorage'}
  `('should store data using $storageType', async ({ storageType }) => {
    const action = createTestAction({
      definition: {
        type: 'storage.write',
        key: { prop: 'key' },
        value: { prop: 'data' },
        storage: storageType,
      },
      appStorage,
    });
    const data = {
      key: 'key',
      data: { this: 'is', 0: 'some', arbitrary: { data: 'storage' } },
      date: '2022-11-18T13:08:03.128Z',
    };
    const result = await action({
      key: 'key',
      data,
    });
    const storageData = await readStorage(storageType, 'key', appStorage);
    expect(result).toStrictEqual({ key: 'key', data });
    expect(storageData).toStrictEqual(data);
  });

  it('should set an expiry for the data', async () => {
    const action = createTestAction({
      definition: {
        type: 'storage.write',
        key: 'test-key',
        value: 'test-value',
        storage: 'localStorage',
        expiry: '1d',
      },
    });
    await action({});
    const storageData = JSON.parse(localStorage.getItem('appsemble-42-test-key') ?? '');
    expect(storageData).toMatchObject({
      expiry: expect.any(Number),
      value: 'test-value',
    });
  });
});

describe('storage.delete', () => {
  it.each`
    storageType         | expectedResult
    ${'localStorage'}   | ${'Could not find data at this key.'}
    ${'sessionStorage'} | ${'Could not find data at this key.'}
    ${'indexedDB'}      | ${undefined}
    ${'appStorage'}     | ${'Could not find data at this key.'}
  `(
    'should delete an existing item entirely using $storageType',
    async ({ expectedResult, storageType }) => {
      const action = createTestAction({
        definition: {
          type: 'storage.delete',
          key: { prop: 'key' },
          storage: storageType,
        },
        appStorage,
      });
      await action({ key: 'data' });
      let result;

      try {
        result = await readStorage(storageType, 'data', appStorage);
      } catch (error) {
        result = (error as Error).message;
      }

      expect(result).toBe(expectedResult);
    },
  );
});

describe('storage.append', () => {
  it.each`
    storageType
    ${'localStorage'}
    ${'sessionStorage'}
    ${'indexedDB'}
    ${'appStorage'}
  `('should add a new item to an existing dataset using $storageType', async ({ storageType }) => {
    const action = createTestAction({
      definition: {
        type: 'storage.append',
        key: { prop: 'key' },
        value: { prop: 'data' },
        storage: storageType,
      },
      appStorage,
    });
    const data = {
      key: 'key',
      data: { text: 'test' },
    };
    writeStorage(storageType, 'key', [data, data], appStorage);

    const result = await action({
      key: 'key',
      data,
    });

    const newStorage = await readStorage(storageType, 'key', appStorage);

    expect(result).toStrictEqual({ key: 'key', data });
    expect((newStorage as Object[])[1]).toStrictEqual({ key: 'key', data: data.data });
  });

  it('should turn existing dataset with a single object into an array with new value', async () => {
    const action = createTestAction({
      definition: {
        type: 'storage.append',
        key: { prop: 'key' },
        value: { prop: 'data' },
        storage: 'localStorage',
      },
      appStorage,
    });
    const data = {
      key: 'key',
      data: { text: 'test' },
    };

    const result = await action({
      key: 'key',
      data,
    });

    const newStorage = await readStorage('localStorage', 'key', appStorage);

    expect(result).toStrictEqual({ key: 'key', data });
    expect(Array.isArray(newStorage)).toBe(true);
  });

  it('should not create race conditions when appending to the same key', async () => {
    await writeStorage('localStorage', 'key', [], appStorage);
    const action = createTestAction({
      definition: {
        type: 'storage.append',
        key: { prop: 'key' },
        value: { prop: 'data' },
        storage: 'localStorage',
      },
      appStorage,
    });
    const data = {
      key: 'key',
      data: { text: 'test' },
    };

    await Promise.all([action(data), action(data), action(data)]);

    const newStorage = await readStorage('localStorage', 'key', appStorage);

    expect(newStorage).toHaveLength(3);
  });
});

describe('storage.subtract', () => {
  it.each`
    storageType
    ${'localStorage'}
    ${'sessionStorage'}
    ${'indexedDB'}
    ${'appStorage'}
  `(
    'should remove the last item from an existing dataset using $storageType',
    async ({ storageType }) => {
      const action = createTestAction({
        definition: {
          type: 'storage.subtract',
          key: { prop: 'key' },
          storage: storageType,
        },
        appStorage,
      });
      const data = {
        key: 'key',
        data: { text: 'test' },
      };
      writeStorage(storageType, 'key', [data, data, data], appStorage);

      const result = await action({
        key: 'key',
      });

      const newStorage = await readStorage(storageType, 'key', appStorage);

      expect(result).toStrictEqual({ key: 'key' });
      expect(newStorage).toHaveLength(2);
    },
  );

  it('should convert array to single object when there is only one entry left', async () => {
    const action = createTestAction({
      definition: {
        type: 'storage.subtract',
        key: { prop: 'key' },
        storage: 'localStorage',
      },
      appStorage,
    });
    const data = {
      key: 'key',
      data: { text: 'test' },
    };
    writeStorage('localStorage', 'key', [data, data], appStorage);

    await action({
      key: 'key',
    });

    const result = await readStorage('localStorage', 'key', appStorage);

    expect(result).toStrictEqual(data);
  });

  it('should remove storage entry when it subtracts the last entry', async () => {
    const action = createTestAction({
      definition: {
        type: 'storage.subtract',
        key: { prop: 'key' },
        storage: 'localStorage',
      },
      appStorage,
    });
    const data = {
      key: 'key',
      data: { text: 'test' },
    };
    writeStorage('localStorage', 'key', data, appStorage);

    await action({
      key: 'key',
    });
    let result;

    try {
      result = await readStorage('localStorage', 'key', appStorage);
    } catch (error) {
      result = (error as Error).message;
    }

    expect(result).toBe('Could not find data at this key.');
  });
});

describe('storage.update', () => {
  it.each`
    storageType
    ${'localStorage'}
    ${'sessionStorage'}
    ${'indexedDB'}
    ${'appStorage'}
  `(
    'should update the specified item in the dataset using $storageType',
    async ({ storageType }) => {
      const action = createTestAction({
        definition: {
          type: 'storage.update',
          key: { prop: 'key' },
          item: { prop: 'item' },
          value: { prop: 'value' },
          storage: storageType,
        },
        appStorage,
      });
      const data = {
        key: 'key',
        data: { text: 'test' },
      };
      writeStorage(storageType, 'key', [data, data], appStorage);

      await action({
        key: 'key',
        item: 1,
        value: {
          key: 'key',
          data: { text: 'test works' },
        },
      });

      const result = await readStorage(storageType, 'key', appStorage);

      expect((result as Object[])[1]).toStrictEqual({
        key: 'key',
        data: { text: 'test works' },
      });
    },
  );

  it('should update the only item in storage', async () => {
    const action = createTestAction({
      definition: {
        type: 'storage.update',
        key: { prop: 'key' },
        item: { prop: 'item' },
        value: { prop: 'value' },
        storage: 'localStorage',
      },
      appStorage,
    });
    const data = {
      key: 'key',
      data: { text: 'test' },
    };
    writeStorage('localStorage', 'key', data, appStorage);

    await action({
      key: 'key',
      value: {
        key: 'key',
        data: { text: 'test works' },
      },
    });

    const result = await readStorage('localStorage', 'key', appStorage);

    expect(result).toStrictEqual({
      key: 'key',
      data: { text: 'test works' },
    });
  });
});
