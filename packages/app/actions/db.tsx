import { AppAction, GET_ERROR, GET_START, GET_SUCCESS } from './app';

const initialState: IDBDatabase = null;

export default (state: IDBDatabase = initialState, action: AppAction): IDBDatabase => {
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
