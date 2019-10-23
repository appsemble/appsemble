import { Action } from 'redux';
import { ThunkAction } from 'redux-thunk';

import { State } from '.';

interface ServiceWorkerState {
  registration: ServiceWorkerRegistration;
  permission: 'unknown' | 'pending' | 'granted' | 'default' | 'denied';
}

const initialState: ServiceWorkerState = { registration: null, permission: 'unknown' };

const REGISTER_SUCCESS = 'serviceWorker/REGISTER_SUCCESS';
const REGISTER_ERROR = 'serviceWorker/REGISTER_ERROR';
const PERMISSION_START = 'serviceWorker/PERMISSION_START';
const PERMISSION_GRANTED = 'serviceWorker/PERMISSION_GRANTED';
const PERMISSION_DEFAULT = 'serviceWorker/PERMISSION_DEFAULT';
const PERMISSION_DENIED = 'serviceWorker/PERMISSION_DENIED';

interface RegisterSuccessAction extends Action<typeof REGISTER_SUCCESS> {
  registration: ServiceWorkerRegistration;
}

type ServiceWorkerAction =
  | RegisterSuccessAction
  | Action<typeof REGISTER_ERROR>
  | Action<typeof PERMISSION_START>
  | Action<typeof PERMISSION_GRANTED>
  | Action<typeof PERMISSION_DEFAULT>
  | Action<typeof PERMISSION_DENIED>;
type ServiceWorkerThunk = ThunkAction<void, State, null, ServiceWorkerAction>;

export default (
  state: ServiceWorkerState = initialState,
  action: ServiceWorkerAction,
): ServiceWorkerState => {
  switch (action.type) {
    case REGISTER_SUCCESS:
      return { ...state, registration: action.registration };
    case REGISTER_ERROR:
      return { ...state, registration: null };
    case PERMISSION_START:
      return { ...state, permission: 'pending' };
    case PERMISSION_GRANTED:
      return { ...state, permission: 'granted' };
    case PERMISSION_DEFAULT:
      return { ...state, permission: 'default' };
    case PERMISSION_DENIED:
      return { ...state, permission: 'denied' };
    default:
      return state;
  }
};

export function registerServiceWorker(
  registration: ServiceWorkerRegistration,
): RegisterSuccessAction {
  return {
    type: REGISTER_SUCCESS,
    registration,
  };
}

export function registerServiceWorkerError(): Action<typeof REGISTER_ERROR> {
  return {
    type: REGISTER_ERROR,
  };
}

export function requestPermission(): ServiceWorkerThunk {
  return async dispatch => {
    dispatch({ type: PERMISSION_START });

    const permission = await window.Notification.requestPermission();
    if (permission === 'granted') {
      dispatch({ type: PERMISSION_GRANTED });
      return;
    }

    if (permission === 'default') {
      dispatch({ type: PERMISSION_DEFAULT });
      return;
    }

    if (permission === 'denied') {
      dispatch({ type: PERMISSION_DENIED });
    }
  };
}
