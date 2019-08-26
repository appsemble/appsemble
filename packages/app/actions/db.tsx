import { IDBPDatabase } from 'idb';

import { AppAction, GET_ERROR, GET_START, GET_SUCCESS } from './app';

const initialState: IDBPDatabase = null;

export default (state: IDBPDatabase = initialState, action: AppAction): IDBPDatabase => {
  switch (action.type) {
    case GET_START:
      return null;
    case GET_SUCCESS:
      return action.db;
    case GET_ERROR:
      return null;
    default:
      return state;
  }
};
