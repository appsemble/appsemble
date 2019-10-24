import { Authentication } from '@appsemble/types';
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

export const initialState: UserState = {
  initialized: false,
  user: null,
};

interface InitializeAction extends Action<typeof INITIALIZED> {
  user: User;
}

interface LoginSuccessAction extends Action<typeof LOGIN_SUCCESS> {
  user: User;
}

export type UserAction = InitializeAction | LoginSuccessAction | Action<typeof LOGOUT>;
type UserThunk = ThunkAction<void, State, null, UserAction>;
type UserDispatch = ThunkDispatch<State, null, UserAction>;

export default (state = initialState, action: UserAction): UserState => {
  switch (action.type) {
    case INITIALIZED:
      return {
        initialized: true,
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
  await db
    .transaction(AUTH, RW)
    .objectStore(AUTH)
    .delete(0);
  dispatch({
    type: LOGOUT,
  });
}

function setupAuth(
  accessToken: string,
  refreshToken: string,
  url: string,
  db: IDBPDatabase,
  dispatch: UserDispatch,
): { id: string; scope: string } {
  const payload = jwtDecode<JwtPayload>(accessToken);
  const { exp, scopes, sub } = payload;
  if (exp) {
    const timeout = exp * 1e3 - REFRESH_BUFFER - new Date().getTime();
    if (refreshToken) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      timeoutId = setTimeout(refreshTokenLogin, timeout, url, db, dispatch);
    } else {
      timeoutId = setTimeout(doLogout, timeout, dispatch, null, db);
    }
  }
  axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
  return {
    id: sub,
    scope: scopes,
  };
}

async function requestToken(
  url: string,
  params: OAuth2Params,
  db: IDBPDatabase,
  dispatch: UserDispatch,
  refreshURL: string,
): Promise<ReturnType<typeof setupAuth>> {
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
  const { refreshToken, clientId, clientSecret } = ((await db
    .transaction(AUTH)
    .objectStore(AUTH)
    .get(0)) as unknown) as DBUser;
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
      url,
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
export function initAuth(authentication: Authentication): UserThunk {
  return async (dispatch, getState) => {
    const { db, ...state } = getState();
    const token = ((await db
      .transaction(AUTH)
      .objectStore(AUTH)
      .get(0)) as unknown) as DBUser;
    let user = null;
    if (token != null) {
      const auth = (authentication ||
        state.app.definition.authentication ||
        state.app.definition.authentication[0]) as Authentication;
      user = setupAuth(
        token.accessToken,
        token.refreshToken,
        auth.refreshURL || auth.url,
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
 * @param url The url to make a token request to.
 * @param credentials
 * @param credentials.username The username to login with.
 * @param credentials.password The password to login with.
 * @param [refreshURL] A refresh token URL. If this is unused, the url is used instead.
 * @param clientId Client ID of application to authenticate to.
 * @param scope Requested permission scope(s), separated by spaces.
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

export function oauthLogin(
  url: string,
  token: string,
  _refreshToken: string,
  refreshURL: string,
  clientId: string,
  clientSecret: string,
  scope: string,
): UserThunk {
  return async (dispatch, getState) => {
    const { db } = getState();
    const user = await requestToken(
      url,
      {
        grant_type: 'authorization_code',
        code: token,
        client_id: clientId,
        client_secret: clientSecret,
        scope,
      },
      db,
      dispatch,
      refreshURL,
    );

    dispatch({ type: LOGIN_SUCCESS, user });
  };
}
