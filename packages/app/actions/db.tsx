import { Action } from 'redux';

import { GET_ERROR, GET_START, GET_SUCCESS } from './app';

const initialState: IDBDatabase = null;
interface GetDBSuccess extends Action<typeof GET_SUCCESS> {
  db: IDBDatabase;
}

type DBAction = Action<typeof GET_START> | GetDBSuccess | Action<typeof GET_ERROR>;

export default (state: IDBDatabase = initialState, action: DBAction): IDBDatabase => {
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
