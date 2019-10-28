import axios from 'axios';
import { Action } from 'redux';
import { ThunkAction } from 'redux-thunk';

import settings from '../utils/settings';
import urlB64ToUint8Array from '../utils/urlB64ToUint8Array';
import { State } from '.';

export type Permission = NotificationPermission | 'pending';

interface ServiceWorkerState {
  registration: ServiceWorkerRegistration;
  permission: Permission;
  subscribed: boolean;
}

const initialState: ServiceWorkerState = {
  registration: null,
  permission: 'default',
  subscribed: false,
};

const REGISTER_SUCCESS = 'serviceWorker/REGISTER_SUCCESS';
const REGISTER_ERROR = 'serviceWorker/REGISTER_ERROR';
const PERMISSION_PENDING = 'serviceWorker/PERMISSION_PENDING';
const PERMISSION_GRANTED = 'serviceWorker/PERMISSION_GRANTED';
const PERMISSION_DEFAULT = 'serviceWorker/PERMISSION_DEFAULT';
const PERMISSION_DENIED = 'serviceWorker/PERMISSION_DENIED';
const SET_SUBSCRIBED = 'serviceWorker/SET_SUBSCRIBED';

interface RegisterSuccessAction extends Action<typeof REGISTER_SUCCESS> {
  registration: ServiceWorkerRegistration;
  subscribed: boolean;
  permission: Permission;
}

interface SetSubscribedAction extends Action<typeof SET_SUBSCRIBED> {
  subscribed: boolean;
}

type ServiceWorkerAction =
  | RegisterSuccessAction
  | Action<typeof REGISTER_ERROR>
  | Action<typeof PERMISSION_PENDING>
  | Action<typeof PERMISSION_GRANTED>
  | Action<typeof PERMISSION_DEFAULT>
  | Action<typeof PERMISSION_DENIED>
  | SetSubscribedAction;
type ServiceWorkerThunk = ThunkAction<void, State, null, ServiceWorkerAction>;

export default (
  state: ServiceWorkerState = initialState,
  action: ServiceWorkerAction,
): ServiceWorkerState => {
  switch (action.type) {
    case REGISTER_SUCCESS:
      return { ...state, registration: action.registration, subscribed: action.subscribed };
    case REGISTER_ERROR:
      return { ...state, registration: null };
    case PERMISSION_PENDING:
      return { ...state, permission: 'pending' };
    case PERMISSION_GRANTED:
      return { ...state, permission: 'granted' };
    case PERMISSION_DEFAULT:
      return { ...state, permission: 'default' };
    case PERMISSION_DENIED:
      return { ...state, permission: 'denied' };
    case SET_SUBSCRIBED:
      return { ...state, subscribed: action.subscribed };
    default:
      return state;
  }
};

export function registerServiceWorker(registration: ServiceWorkerRegistration): ServiceWorkerThunk {
  return async dispatch => {
    const subscription = await registration.pushManager.getSubscription();

    dispatch({
      type: REGISTER_SUCCESS,
      registration,
      subscribed: !!subscription,
      permission: window.Notification.permission,
    });
  };
}

export function registerServiceWorkerError(): Action<typeof REGISTER_ERROR> {
  return {
    type: REGISTER_ERROR,
  };
}

export function requestPermission(): ServiceWorkerThunk {
  return async (dispatch): Promise<Permission> => {
    if (window.Notification.permission === 'default') {
      dispatch({ type: PERMISSION_PENDING });
    }

    const permission = await window.Notification.requestPermission();
    if (permission === 'granted') {
      dispatch({ type: PERMISSION_GRANTED });
      return permission;
    }

    if (permission === 'default') {
      dispatch({ type: PERMISSION_DEFAULT });
      return permission;
    }

    if (permission === 'denied') {
      dispatch({ type: PERMISSION_DENIED });
      return permission;
    }

    return permission;
  };
}

export function subscribe(): ServiceWorkerThunk {
  return async (dispatch, getState) => {
    const { registration } = getState().serviceWorker;
    const { vapidPublicKey, id } = settings;
    const options = {
      applicationServerKey: urlB64ToUint8Array(vapidPublicKey),
      userVisibleOnly: true,
    };

    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe(options);

      await axios.post(`/api/apps/${id}/subscriptions`, subscription);

      dispatch({ type: SET_SUBSCRIBED, subscribed: true });
    } else {
      dispatch({ type: SET_SUBSCRIBED, subscribed: true });
    }
  };
}

export function unsubscribe(): ServiceWorkerThunk {
  return async (dispatch, getState) => {
    const { registration } = getState().serviceWorker;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
    }
    dispatch({ type: SET_SUBSCRIBED, subscribed: false });
  };
}
