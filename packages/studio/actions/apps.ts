import { App, Resource } from '@appsemble/types';
import axios from 'axios';
import { Action } from 'redux';
import { ThunkAction } from 'redux-thunk';

export const GET_START = 'apps/GET_START';
export const GET_SUCCESS = 'apps/GET_SUCCESS';
export const APP_GET_SUCCESS = 'app/GET_SUCCESS';
export const GET_ERROR = 'apps/GET_ERROR';
export const UPDATE = 'apps/UPDATE';

const CREATE_SUCCESS = 'app/CREATE_SUCCESS';

interface AppState {
  apps: App[];
  error: Error;
}

interface GetSuccessAction extends Action<typeof GET_SUCCESS> {
  apps: App[];
}

interface GetAppSuccessAction extends Action<typeof APP_GET_SUCCESS> {
  app: App;
}

interface GetAppCreateSuccessAction extends Action<typeof CREATE_SUCCESS> {
  app: App;
}

interface GetAppUpdateAction extends Action<typeof UPDATE> {
  app: App;
}

interface GetErrorAction extends Action<typeof GET_ERROR> {
  error: Error;
}

export type AppAction =
  | Action<typeof GET_START>
  | GetSuccessAction
  | GetAppSuccessAction
  | GetErrorAction
  | GetAppCreateSuccessAction
  | GetAppUpdateAction;
type AppThunk = ThunkAction<void, AppState, null, AppAction>;

const initialState: AppState = {
  apps: [],
  error: null,
};

export default (state: AppState = initialState, action: AppAction): AppState => {
  switch (action.type) {
    case GET_START:
      return {
        ...state,
        error: null,
      };
    case GET_SUCCESS:
      return {
        ...state,
        apps: action.apps,
        error: null,
      };
    case APP_GET_SUCCESS:
      return {
        ...state,
        apps: state.apps.find(a => a.id === action.app.id)
          ? state.apps.map(a => (a.id === action.app.id ? action.app : a))
          : [...state.apps, action.app],
        error: null,
      };

    case GET_ERROR:
      return {
        ...state,
        error: action.error,
      };
    case CREATE_SUCCESS:
      return {
        ...state,
        apps: [...state.apps, action.app],
      };

    case UPDATE:
      return {
        ...state,
        apps: state.apps.map(a => (a.id === action.app.id ? action.app : a)),
      };
    default:
      return state;
  }
};

export function getPublicApps(): AppThunk {
  return async dispatch => {
    dispatch({
      type: GET_START,
    });
    try {
      const { data: apps } = await axios.get('/api/apps');
      dispatch({
        type: GET_SUCCESS,
        apps,
      });
    } catch (error) {
      dispatch({
        type: GET_ERROR,
        error,
      });
    }
  };
}

export function getApps(): AppThunk {
  return async dispatch => {
    dispatch({
      type: GET_START,
    });
    try {
      const { data: apps } = await axios.get('/api/apps/me');
      dispatch({
        type: GET_SUCCESS,
        apps,
      });
    } catch (error) {
      dispatch({
        type: GET_ERROR,
        error,
      });
    }
  };
}

export function getApp(id: number): AppThunk {
  return async dispatch => {
    dispatch({
      type: GET_START,
    });
    try {
      const { data } = await axios.get(`/api/apps/${id}`);
      dispatch({
        type: APP_GET_SUCCESS,
        app: data,
      });
    } catch (error) {
      dispatch({
        type: GET_ERROR,
        error,
      });
    }
  };
}

export function createApp(recipe: App, organization: { id: string }): AppThunk {
  return async dispatch => {
    const formData = new FormData();
    formData.append('app', JSON.stringify(recipe));
    formData.append('organizationId', organization.id);

    const { data: app } = await axios.post('/api/apps', formData);
    dispatch({
      type: CREATE_SUCCESS,
      app,
    });

    return app;
  };
}

export function createTemplateApp(
  {
    templateId,
    name,
    description,
    isPrivate,
    resources,
  }: {
    templateId: number;
    name: string;
    description: string;
    isPrivate: boolean;
    resources: Resource[];
  },
  organization: { id: string },
): AppThunk {
  return async dispatch => {
    const { data: app } = await axios.post('/api/templates', {
      templateId,
      name,
      description,
      organizationId: organization.id,
      resources,
      private: isPrivate,
    });

    dispatch({
      type: CREATE_SUCCESS,
      app,
    });

    return app;
  };
}

export function updateApp(app: App): AppThunk {
  return async dispatch => {
    dispatch({
      type: UPDATE,
      app,
    });
  };
}
