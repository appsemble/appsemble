import { IDBPDatabase } from 'idb';

import { createTestAction } from '../makeActions.js';
import { getDB } from './storage.js';

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
  it('should read from the store', async () => {
    const action = createTestAction({
      definition: { type: 'storage.read', key: { prop: 'test' } },
    });
    const result = await action({ test: 'data' });
    expect(result).toBe('This is default test data!');
  });

  it('should return undefined for unknown keys in the store', async () => {
    const action = createTestAction({
      definition: { type: 'storage.read', key: { prop: 'test' } },
    });
    const result = await action({ test: 'bla' });
    expect(result).toBeUndefined();
  });

  it('should read from localStorage', async () => {
    const action = createTestAction({
      definition: { type: 'storage.read', key: { prop: 'test' }, storage: 'localStorage' },
    });
    const result = await action({ test: 'data' });
    expect(result).toBe('This is default test data from localStorage!');
  });

  it('should read from sessionStorage', async () => {
    const action = createTestAction({
      definition: { type: 'storage.read', key: { prop: 'test' }, storage: 'sessionStorage' },
    });
    const result = await action({ test: 'data' });
    expect(result).toBe('This is default test data from sessionStorage!');
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
  it('should store data using idb', async () => {
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

  it('should store data using localStorage', async () => {
    const action = createTestAction({
      definition: {
        type: 'storage.write',
        key: { prop: 'key' },
        value: { prop: 'data' },
        storage: 'localStorage',
      },
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
    expect(JSON.parse(localStorage.getItem('appsemble-42-key'))).toStrictEqual({
      ...data,
      date: data.date.toISOString(),
    });
  });

  it('should store data using sessionStorage', async () => {
    const action = createTestAction({
      definition: {
        type: 'storage.write',
        key: { prop: 'key' },
        value: { prop: 'data' },
        storage: 'sessionStorage',
      },
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
    expect(JSON.parse(sessionStorage.getItem('appsemble-42-key'))).toStrictEqual({
      ...data,
      date: data.date.toISOString(),
    });
  });
});

describe('storage.delete', () => {
  it('should delete an existing item entirely using localStorage', async () => {
    const action = createTestAction({
      definition: {
        type: 'storage.delete',
        key: { prop: 'key' },
        storage: 'localStorage',
      },
    });
    await action({ key: 'data' });
    const result = localStorage.getItem('appsemble-42-data');
    expect(result).toBeNull();
  });

  it('should delete an existing item entirely using sessionStorage', async () => {
    const action = createTestAction({
      definition: {
        type: 'storage.delete',
        key: { prop: 'key' },
        storage: 'sessionStorage',
      },
    });
    await action({ key: 'data' });
    const result = sessionStorage.getItem('appsemble-42-data');
    expect(result).toBeNull();
  });

  it('should delete an existing item entirely using indexedDB', async () => {
    const action = createTestAction({
      definition: {
        type: 'storage.delete',
        key: { prop: 'key' },
        storage: 'indexedDB',
      },
    });
    await action({ key: 'data' });
    const result = await db.get('storage', 'data');
    expect(result).toBeUndefined();
  });
});

describe('storage.append', () => {
  it('should add a new item to an existing dataset using localStorage', async () => {
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
    localStorage.setItem('appsemble-42-key', JSON.stringify([data, data]));

    const result = await action({
      key: 'key',
      data,
    });

    const newStorage = JSON.parse(localStorage.getItem('appsemble-42-key'));

    expect(result).toStrictEqual({ key: 'key', data });
    expect(newStorage[1]).toStrictEqual({ key: 'key', data: data.data });
  });

  it('should add a new item to an existing dataset using sessionStorage', async () => {
    const action = createTestAction({
      definition: {
        type: 'storage.append',
        key: { prop: 'key' },
        value: { prop: 'data' },
        storage: 'sessionStorage',
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

    const newStorage = JSON.parse(sessionStorage.getItem('appsemble-42-key'));

    expect(result).toStrictEqual({ key: 'key', data });
    expect(newStorage[1]).toStrictEqual({ key: 'key', data: data.data });
  });

  it('should add a new item to an existing dataset using indexedDB', async () => {
    const action = createTestAction({
      definition: {
        type: 'storage.append',
        key: { prop: 'key' },
        value: { prop: 'data' },
        storage: 'indexedDB',
      },
    });
    const data = {
      key: 'key',
      data: { text: 'test' },
    };

    const result = await action({
      key: 'data',
      data,
    });

    const newStorage = await db.get('storage', 'data');

    expect(result).toStrictEqual({ key: 'data', data });
    expect(newStorage[1]).toStrictEqual({ key: 'key', data: data.data });
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

    const newStorage = JSON.parse(localStorage.getItem('appsemble-42-key'));

    expect(result).toStrictEqual({ key: 'key', data });
    expect(Array.isArray(newStorage)).toBe(true);
  });
});

describe('storage.subtract', () => {
  it('should remove the last item from an existing dataset using localStorage', async () => {
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
    localStorage.setItem('appsemble-42-key', JSON.stringify([data, data, data]));

    const result = await action({
      key: 'key',
    });

    const newStorage = JSON.parse(localStorage.getItem('appsemble-42-key'));

    expect(result).toStrictEqual({ key: 'key' });
    expect(newStorage).toHaveLength(2);
  });

  it('should remove the last item from an existing dataset using sessionStorage', async () => {
    const action = createTestAction({
      definition: {
        type: 'storage.subtract',
        key: { prop: 'key' },
        storage: 'sessionStorage',
      },
    });
    const data = {
      key: 'key',
      data: { text: 'test' },
    };
    sessionStorage.setItem('appsemble-42-key', JSON.stringify([data, data, data]));

    const result = await action({
      key: 'key',
    });

    const newStorage = JSON.parse(sessionStorage.getItem('appsemble-42-key'));

    expect(result).toStrictEqual({ key: 'key' });
    expect(newStorage).toHaveLength(2);
  });

  it('should remove the last item from an existing dataset using indexedDB', async () => {
    const action = createTestAction({
      definition: {
        type: 'storage.subtract',
        key: { prop: 'key' },
        storage: 'indexedDB',
      },
    });
    const data = {
      key: 'key',
      data: { text: 'test' },
    };
    await db.put('storage', [data, data, data], 'data');

    const result = await action({
      key: 'data',
    });

    const newStorage = await db.get('storage', 'data');

    expect(result).toStrictEqual({ key: 'data' });
    expect(newStorage).toHaveLength(2);
  });

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
    localStorage.setItem('appsemble-42-key', JSON.stringify([data, data]));

    await action({
      key: 'key',
    });

    const result = JSON.parse(localStorage.getItem('appsemble-42-key'));

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
    localStorage.setItem('appsemble-42-key', JSON.stringify(data));

    await action({
      key: 'key',
    });

    const result = JSON.parse(localStorage.getItem('appsemble-42-key'));

    expect(result).toBeNull();
  });
});

describe('storage.update', () => {
  it('should update the specified item in the dataset using localStorage', async () => {
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
    localStorage.setItem('appsemble-42-key', JSON.stringify([data, data]));

    await action({
      key: 'key',
      item: 1,
      value: {
        key: 'key',
        data: { text: 'test works' },
      },
    });

    const result = JSON.parse(localStorage.getItem('appsemble-42-key'));

    expect(result[1]).toStrictEqual({
      key: 'key',
      data: { text: 'test works' },
    });
  });

  it('should update the specified item in the dataset using sessionStorage', async () => {
    const action = createTestAction({
      definition: {
        type: 'storage.update',
        key: { prop: 'key' },
        item: { prop: 'item' },
        value: { prop: 'value' },
        storage: 'sessionStorage',
      },
    });
    const data = {
      key: 'key',
      data: { text: 'test' },
    };
    sessionStorage.setItem('appsemble-42-key', JSON.stringify([data, data]));

    await action({
      key: 'key',
      item: 1,
      value: {
        key: 'key',
        data: { text: 'test works' },
      },
    });

    const result = JSON.parse(sessionStorage.getItem('appsemble-42-key'));

    expect(result[1]).toStrictEqual({
      key: 'key',
      data: { text: 'test works' },
    });
  });

  it('should update the specified item in the dataset using indexedDB', async () => {
    const action = createTestAction({
      definition: {
        type: 'storage.update',
        key: { prop: 'key' },
        item: { prop: 'item' },
        value: { prop: 'value' },
        storage: 'indexedDB',
      },
    });
    const data = {
      key: 'key',
      data: { text: 'test' },
    };

    await db.put('storage', [data, data], 'data');

    await action({
      key: 'data',
      item: 1,
      value: {
        key: 'key',
        data: { text: 'test works' },
      },
    });

    const result = await db.get('storage', 'data');

    expect(result[1]).toStrictEqual({
      key: 'key',
      data: { text: 'test works' },
    });
  });

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
    localStorage.setItem('appsemble-42-key', JSON.stringify(data));

    await action({
      key: 'key',
      value: {
        key: 'key',
        data: { text: 'test works' },
      },
    });

    const result = JSON.parse(localStorage.getItem('appsemble-42-key'));

    expect(result).toStrictEqual({
      key: 'key',
      data: { text: 'test works' },
    });
  });
});
