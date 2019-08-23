import { App } from '@appsemble/types';
import { Action } from 'redux';
import { ThunkAction } from 'redux-thunk';

import resolveJsonPointers from '../utils/resolveJsonPointers';

export const GET_START = 'app/GET_START';
export const GET_SUCCESS = 'app/GET_SUCCESS';
export const GET_ERROR = 'app/GET_ERROR';
const EDIT_SUCCESS = 'editor/EDIT_SUCCESS';

export interface AppState {
  app: App;
  error: Error;
}

const initialState: AppState = {
  app: null,
  error: null,
};

interface GetSuccessAction extends Action<typeof GET_SUCCESS> {
  app: App;
}

interface GetErrorAction extends Action<typeof GET_ERROR> {
  error: Error;
}

interface EditAction extends Action<typeof EDIT_SUCCESS> {
  app: App;
}

type AppAction = Action<typeof GET_START> | GetSuccessAction | GetErrorAction | EditAction;
type AppThunk = ThunkAction<void, AppState, null, AppAction>;

export default (state: AppState = initialState, action: AppAction): AppState => {
  switch (action.type) {
    case GET_START:
      return {
        ...state,
        app: null,
        error: null,
      };
    case GET_SUCCESS:
      return {
        ...state,
        app: action.app,
        error: null,
      };
    case GET_ERROR:
      return {
        ...state,
        app: null,
        error: action.error,
      };
    case EDIT_SUCCESS:
      return {
        ...state,
        app: action.app,
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
      const app = resolveJsonPointers(window.settings.app) as App;
      dispatch({
        type: GET_SUCCESS,
        app,
      });
    } catch (error) {
      dispatch({
        type: GET_ERROR,
        error,
      });
    }
  };
}
