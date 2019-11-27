import axios from 'axios';
import { IDBPDatabase } from 'idb';
import jwtDecode from 'jwt-decode';
import { Action } from 'redux';
import { ThunkAction, ThunkDispatch } from 'redux-thunk';

import { User } from '../types';
import { AUTH, RW } from '../utils/getDB';
import { State } from './index';

// The buffer between the access token expiration and the refresh token request. A minute should be
// plenty of time for the refresh token request to finish.
const REFRESH_BUFFER = 60e3;

const INITIALIZED = 'user/INITIALIZED';
const UPDATED = 'user/UPDATED';
const LOGIN_SUCCESS = 'user/LOGIN_SUCCESS';
const LOGOUT = 'user/LOGOUT';
let timeoutId: NodeJS.Timeout;

interface UserState {
  initialized: boolean;
  user: User;
}

interface OAuth2Params {
  // eslint-disable-next-line camelcase
  grant_type: 'refresh_token' | 'authentication' | 'password' | 'authorization_code';
  // eslint-disable-next-line camelcase
  client_id?: string;
  // eslint-disable-next-line camelcase
  client_secret?: string;
  // eslint-disable-next-line camelcase
  refresh_token?: string;
  code?: string;
  username?: string;
  password?: string;
  scope?: string;
}

interface JwtPayload {
  exp: number;
  scopes: string;
  sub: string;
}

interface DBUser {
  accessToken: string;
  refreshToken: string;
  clientId: string;
  clientSecret: string;
}

interface InitializeAction extends Action<typeof INITIALIZED> {
  user: User;
}

interface LoginSuccessAction extends Action<typeof LOGIN_SUCCESS> {
  user: User;
}

interface UpdateAction extends Action<typeof UPDATED> {
  user: User;
}

export type UserAction =
  | InitializeAction
  | LoginSuccessAction
  | UpdateAction
  | Action<typeof LOGOUT>;
type UserThunk = ThunkAction<void, State, null, UserAction>;
type UserDispatch = ThunkDispatch<State, null, UserAction>;

export const initialState: UserState = {
  initialized: false,
  user: null,
};

export default (state = initialState, action: UserAction): UserState => {
  switch (action.type) {
    case INITIALIZED:
      return {
        initialized: true,
        user: action.user,
      };
    case UPDATED:
      return {
        ...state,
        user: action.user,
      };
    case LOGIN_SUCCESS:
      return {
        ...state,
        user: action.user,
      };
    case LOGOUT:
      return {
        ...state,
        user: null,
      };
    default:
      return state;
  }
};

async function doLogout(
  dispatch: UserDispatch,
  getState: () => State,
  db = getState().db,
): Promise<void> {
  delete axios.defaults.headers.common.Authorization;
  clearTimeout(timeoutId);
  db.transaction(AUTH, RW)
    .objectStore(AUTH)
    .delete(0);
  dispatch({
    type: LOGOUT,
  });
}

export async function requestUser(): Promise<User> {
  const { data } = await axios.get<User>('/api/user');
  return data;
}

async function setupAuth(
  accessToken: string,
  refreshToken: string,
  url: string,
  db: IDBPDatabase,
  dispatch: UserDispatch,
): Promise<User & { scope: string }> {
  const payload = jwtDecode<JwtPayload>(accessToken);
  const { exp, scopes, sub } = payload;

  const timeout = exp * 1e3 - REFRESH_BUFFER - new Date().getTime();

  if (refreshToken) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    timeoutId = setTimeout(refreshTokenLogin, timeout, url, db, dispatch);
  } else {
    timeoutId = setTimeout(doLogout, timeout, dispatch, null, db);
  }

  axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
  try {
    const user = await requestUser();
    return {
      ...user,
      id: Number(sub),
      scope: scopes,
    };
  } catch (exception) {
    await doLogout(dispatch, null, db);
    return null;
  }
}

async function requestToken(
  url: string,
  params: OAuth2Params,
  db: IDBPDatabase,
  dispatch: UserDispatch,
  refreshURL?: string,
): ReturnType<typeof setupAuth> {
  const { data } = await axios.post(url, new URLSearchParams(params as Record<string, any>));
  const { access_token: accessToken, refresh_token: refreshToken } = data;
  const tx = db.transaction(AUTH, RW);
  await tx.objectStore(AUTH).put(
    {
      accessToken,
      refreshToken,
      clientId: params.client_id,
      clientSecret: params.client_secret,
    },
    0,
  );

  return setupAuth(accessToken, refreshToken, refreshURL || url, db, dispatch);
}

async function refreshTokenLogin(
  url: string,
  db: IDBPDatabase,
  dispatch: UserDispatch,
): Promise<void> {
  const { refreshToken, clientId, clientSecret } = (await db
    .transaction(AUTH)
    .objectStore(AUTH)
    .get(0)) as DBUser;

  try {
    const user = await requestToken(
      url,
      {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        ...(clientId && { client_id: clientId }),
        ...(clientSecret && { client_secret: clientSecret }),
      },
      db,
      dispatch,
    );
    dispatch({
      type: LOGIN_SUCCESS,
      user,
    });
  } catch (error) {
    doLogout(dispatch, null, db);
  }
}

/**
 * Initialize all authentication.
 *
 * - Authentication data is read from the local database.
 * - The refresh token loop is started.
 * - Axios is configured.
 * - The user is restored.
 */
export function initAuth(): UserThunk {
  return async (dispatch, getState) => {
    const { db } = getState();
    const token = await db
      .transaction(AUTH)
      .objectStore(AUTH)
      .get(0);
    let user = null;
    if (token != null) {
      user = await setupAuth(
        token.accessToken,
        token.refreshToken,
        '/api/oauth/token',
        db,
        dispatch,
      );
    }
    dispatch({
      type: INITIALIZED,
      user,
    });
  };
}

/**
 * Logout from the current session.
 *
 * This resets the user in the redux store, removes the Authorization header from requests made,
 * and removes the access token and refresh token from the indexed db.
 */
export function logout(): UserThunk {
  return doLogout;
}

/**
 * Login using JWT / OAuth2 password grant type.
 *
 * @param {string} url The url to make a token request to.
 * @param {Object} credentials
 * @param {string} credentials.username The username to login with.
 * @param {string} credentials.password The password to login with.
 * @param {string} [refreshURL] A refresh token URL. If this is unused, the url is used instead.
 * @param {string} clientId Client ID of application to authenticate to.
 * @param {string} scope Requested permission scope(s), separated by spaces.
 */
export function passwordLogin(
  url: string,
  { username, password }: { username: string; password: string },
  refreshURL: string,
  clientId: string,
  scope: string,
): UserThunk {
  return async (dispatch, getState) => {
    const { db } = getState();
    const user = await requestToken(
      url,
      {
        grant_type: 'password',
        username,
        password,
        ...(clientId && { client_id: clientId }),
        ...(scope && { scope }),
      },
      db,
      dispatch,
      refreshURL,
    );
    dispatch({
      type: LOGIN_SUCCESS,
      user,
    });
  };
}

export function oauthLogin(token: string): UserThunk {
  return async (dispatch, getState) => {
    const { db } = getState();
    const user = await requestToken(
      '/api/oauth/token',
      {
        grant_type: 'authorization_code',
        code: token,
        client_id: 'appsemble-studio',
        client_secret: 'appsemble-studio-secret',
        scope: 'apps:read apps:write',
      },
      db,
      dispatch,
    );

    dispatch({ type: LOGIN_SUCCESS, user });
  };
}

export function fetchUser(): UserThunk {
  return async dispatch => {
    const user = await requestUser();
    dispatch({ type: UPDATED, user });
  };
}

export function updateUser(user: User): UserThunk {
  return async dispatch => {
    dispatch({ type: UPDATED, user });
  };
}

export function resetPassword(token: string, password: string) {
  return async () => axios.post('/api/email/reset', { token, password });
}

export function requestResetPassword(email: string) {
  return async () => axios.post('/api/email/reset/request', { email });
}

export function registerEmail(email: string, password: string, organization: string) {
  return async () => axios.post('/api/email', { email, password, organization });
}

export function verifyEmail(token: string) {
  return async () => axios.post('/api/email/verify', { token });
}
