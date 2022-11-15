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
});
