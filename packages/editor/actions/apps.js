import axios from 'axios';

export const GET_START = 'apps/GET_START';
export const GET_SUCCESS = 'apps/GET_SUCCESS';
export const APP_GET_SUCCESS = 'app/GET_SUCCESS';
export const GET_ERROR = 'apps/GET_ERROR';
export const UPDATE = 'apps/UPDATE';

const CREATE_SUCCESS = 'app/CREATE_SUCCESS';

const initialState = {
  apps: [],
  error: null,
};

export default (state = initialState, action) => {
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

export function getPublicApps() {
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

export function getApps() {
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

export function getApp(id) {
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

export function createApp(recipe, organization) {
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
  { template, name, description, isPrivate, resources },
  organization,
) {
  return async dispatch => {
    const { data: app } = await axios.post('/api/templates', {
      template,
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

export function updateApp(app) {
  return async dispatch => {
    dispatch({
      type: UPDATE,
      app,
    });
  };
}
