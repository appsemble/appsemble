import { AppDefinition } from '@appsemble/types';
import { IDBPDatabase } from 'idb';
import { Action } from 'redux';
import { ThunkAction } from 'redux-thunk';

import getDB from '../utils/getDB';
import resolveJsonPointers from '../utils/resolveJsonPointers';
import settings from '../utils/settings';

export const GET_START = 'app/GET_START';
export const GET_SUCCESS = 'app/GET_SUCCESS';
export const GET_ERROR = 'app/GET_ERROR';
const EDIT_SUCCESS = 'editor/EDIT_SUCCESS';

export interface AppState {
  definition: AppDefinition;
  error: Error;
}

export const initialState: AppState = {
  definition: null,
  error: null,
};

interface GetSuccessAction extends Action<typeof GET_SUCCESS> {
  definition: AppDefinition;
  db: IDBPDatabase;
}

interface GetErrorAction extends Action<typeof GET_ERROR> {
  error: Error;
}

interface EditAction extends Action<typeof EDIT_SUCCESS> {
  definition: AppDefinition;
}

export type AppAction = Action<typeof GET_START> | GetSuccessAction | GetErrorAction | EditAction;
type AppThunk = ThunkAction<void, AppState, null, AppAction>;

export default (state: AppState = initialState, action: AppAction): AppState => {
  switch (action.type) {
    case GET_START:
      return {
        ...state,
        definition: null,
        error: null,
      };
    case GET_SUCCESS:
      return {
        ...state,
        definition: action.definition,
        error: null,
      };
    case GET_ERROR:
      return {
        ...state,
        definition: null,
        error: action.error,
      };
    case EDIT_SUCCESS:
      return {
        ...state,
        definition: action.definition,
      };
    default:
      return state;
  }
};

/**
 * Get the app for the app id in the base URI.
 */
export function getApp(): AppThunk {
  return async dispatch => {
    dispatch({
      type: GET_START,
    });
    try {
      const definition = resolveJsonPointers(settings.definition) as AppDefinition;
      const db = await getDB(settings.id);
      dispatch({
        type: GET_SUCCESS,
        definition,
        db,
      });
    } catch (error) {
      dispatch({
        type: GET_ERROR,
        error,
      });
    }
  };
}
