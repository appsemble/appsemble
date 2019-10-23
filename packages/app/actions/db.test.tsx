import { IDBPDatabase } from 'idb';

import { AppAction, GET_ERROR, GET_START, GET_SUCCESS } from './app';
import reducer from './db';

describe('reducer', () => {
  it('should return the default state', () => {
    const result = reducer(null, ({} as unknown) as AppAction);
    expect(result).toBeNull();
  });

  it('should handle GET_START actions', () => {
    const result = reducer(null, { type: GET_START });
    expect(result).toBeNull();
  });

  it('should handle GET_ERROR actions', () => {
    const result = reducer(null, { type: GET_ERROR, error: Error('Sum Ting Wong') });
    expect(result).toBeNull();
  });

  it('should handle GET_SUCCESS actions', () => {
    const result = reducer(null, {
      type: GET_SUCCESS,
      definition: null,
      db: ({} as unknown) as IDBPDatabase,
    });

    expect(result).toStrictEqual(({} as unknown) as IDBPDatabase);
  });
});
