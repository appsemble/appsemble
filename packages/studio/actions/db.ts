import { IDBPDatabase } from 'idb';

import { AppAction } from './apps';

const initialState: IDBPDatabase = null;

export default (state: IDBPDatabase = initialState, action: AppAction): IDBPDatabase => {
  switch (action.type) {
    default:
      return state;
  }
};
