import { Action } from 'redux';

const initialState: ServiceWorkerRegistration = null;

const REGISTER_SUCCESS = 'serviceWorker/REGISTER_SUCCESS';
const REGISTER_ERROR = 'serviceWorker/REGISTER_ERROR';

interface RegisterSuccessAction extends Action<typeof REGISTER_SUCCESS> {
  registration: ServiceWorkerRegistration;
}

type ServiceWorkerAction = RegisterSuccessAction | Action<typeof REGISTER_ERROR>;

export default (
  state: ServiceWorkerRegistration = initialState,
  action: ServiceWorkerAction,
): ServiceWorkerRegistration => {
  switch (action.type) {
    case REGISTER_SUCCESS:
      return action.registration;
    case REGISTER_ERROR:
      return null;
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
