import { IDBPDatabase } from 'idb';

import { createTestAction } from '../makeActions.js';
import { getDB, readStorage, writeStorage } from './storage.js';

let db: IDBPDatabase;

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
});

describe('storage.read', () => {
  it.each`
    storageType         | expectedResult
    ${'localStorage'}   | ${'This is default test data from localStorage!'}
    ${'sessionStorage'} | ${'This is default test data from sessionStorage!'}
    ${'indexedDB'}      | ${'This is default test data!'}
  `('should read from $storageType', async ({ expectedResult, storageType }) => {
    const action = createTestAction({
      definition: { type: 'storage.read', key: { prop: 'test' }, storage: storageType },
    });
    const result = await action({ test: 'data' });
    expect(result).toBe(expectedResult);
  });

  it('should return undefined for unknown keys in the store', async () => {
    const action = createTestAction({
      definition: { type: 'storage.read', key: { prop: 'test' } },
    });
    const result = await action({ test: 'bla' });
    expect(result).toBeUndefined();
  });

  it('should throw error when key is not valid', async () => {
    const action = createTestAction({
      definition: { type: 'storage.read', key: { prop: 'key' }, storage: 'localStorage' },
    });
    let result;

    try {
      result = await action({ key: 'invalid key' });
    } catch (error) {
      result = (error as Error).message;
    }

    expect(result).toBe('Could not find data at this key.');
  });
});

describe('storage.write', () => {
  it.each`
    storageType
    ${'localStorage'}
    ${'sessionStorage'}
    ${'indexedDB'}
  `('should store data using $storageType', async ({ storageType }) => {
    const action = createTestAction({
      definition: {
        type: 'storage.write',
        key: { prop: 'key' },
        value: { prop: 'data' },
        storage: storageType,
      },
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
    const storageData = await readStorage(storageType, 'key');
    expect(result).toStrictEqual({ key: 'key', data });
    expect(storageData).toStrictEqual(data);
  });
});

describe('storage.delete', () => {
  it.each`
    storageType         | expectedResult
    ${'localStorage'}   | ${'Could not find data at this key.'}
    ${'sessionStorage'} | ${'Could not find data at this key.'}
    ${'indexedDB'}      | ${undefined}
  `(
    'should delete an existing item entirely using $storageType',
    async ({ expectedResult, storageType }) => {
      const action = createTestAction({
        definition: {
          type: 'storage.delete',
          key: { prop: 'key' },
          storage: storageType,
        },
      });
      await action({ key: 'data' });
      let result;

      try {
        result = await readStorage(storageType, 'data');
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
  `('should add a new item to an existing dataset using $storageType', async ({ storageType }) => {
    const action = createTestAction({
      definition: {
        type: 'storage.append',
        key: { prop: 'key' },
        value: { prop: 'data' },
        storage: storageType,
      },
    });
    const data = {
      key: 'key',
      data: { text: 'test' },
    };
    writeStorage(storageType, 'key', [data, data]);

    const result = await action({
      key: 'key',
      data,
    });

    const newStorage = await readStorage(storageType, 'key');

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
    });
    const data = {
      key: 'key',
      data: { text: 'test' },
    };

    const result = await action({
      key: 'key',
      data,
    });

    const newStorage = await readStorage('localStorage', 'key');

    expect(result).toStrictEqual({ key: 'key', data });
    expect(Array.isArray(newStorage)).toBe(true);
  });
});

describe('storage.subtract', () => {
  it.each`
    storageType
    ${'localStorage'}
    ${'sessionStorage'}
    ${'indexedDB'}
  `(
    'should remove the last item from an existing dataset using $storageType',
    async ({ storageType }) => {
      const action = createTestAction({
        definition: {
          type: 'storage.subtract',
          key: { prop: 'key' },
          storage: storageType,
        },
      });
      const data = {
        key: 'key',
        data: { text: 'test' },
      };
      writeStorage(storageType, 'key', [data, data, data]);

      const result = await action({
        key: 'key',
      });

      const newStorage = await readStorage(storageType, 'key');

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
    });
    const data = {
      key: 'key',
      data: { text: 'test' },
    };
    writeStorage('localStorage', 'key', [data, data]);

    await action({
      key: 'key',
    });

    const result = await readStorage('localStorage', 'key');

    expect(result).toStrictEqual(data);
  });

  it('should remove storage entry when it subtracts the last entry', async () => {
    const action = createTestAction({
      definition: {
        type: 'storage.subtract',
        key: { prop: 'key' },
        storage: 'localStorage',
      },
    });
    const data = {
      key: 'key',
      data: { text: 'test' },
    };
    writeStorage('localStorage', 'key', data);

    await action({
      key: 'key',
    });
    let result;

    try {
      result = await readStorage('localStorage', 'key');
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
      });
      const data = {
        key: 'key',
        data: { text: 'test' },
      };
      writeStorage(storageType, 'key', [data, data]);

      await action({
        key: 'key',
        item: 1,
        value: {
          key: 'key',
          data: { text: 'test works' },
        },
      });

      const result = await readStorage(storageType, 'key');

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
    });
    const data = {
      key: 'key',
      data: { text: 'test' },
    };
    writeStorage('localStorage', 'key', data);

    await action({
      key: 'key',
      value: {
        key: 'key',
        data: { text: 'test works' },
      },
    });

    const result = await readStorage('localStorage', 'key');

    expect(result).toStrictEqual({
      key: 'key',
      data: { text: 'test works' },
    });
  });
});
