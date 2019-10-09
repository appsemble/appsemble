import { IDBPDatabase } from 'idb';

import { AppAction, GET_ERROR, GET_START, GET_SUCCESS } from './app';
import reducer from './db';

describe('Database Redux', () => {
  it('should return the default state', () => {
    expect(reducer(null, ({} as unknown) as AppAction)).toBeNull();
  });

  it('should handle GET_START actions', () => {
    expect(reducer(null, { type: GET_START })).toBeNull();
  });

  it('should handle GET_ERROR actions', () => {
    expect(reducer(null, { type: GET_ERROR, error: Error('Sum Ting Wong') })).toBeNull();
  });

  it('should handle GET_SUCCESS actions', () => {
    expect(
      reducer(null, {
        type: GET_SUCCESS,
        app: null,
        db: ({} as unknown) as IDBPDatabase,
      }),
    ).toStrictEqual(({} as unknown) as IDBPDatabase);
  });
});
