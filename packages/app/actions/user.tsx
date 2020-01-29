import { Authentication, UserInfo } from '@appsemble/types';
import axios from 'axios';
import jwtDecode from 'jwt-decode';
import { Action } from 'redux';
import { ThunkAction, ThunkDispatch } from 'redux-thunk';

import { User } from '../types';
import settings from '../utils/settings';
import { State } from './index';

// The buffer between the access token expiration and the refresh token request. A minute should be
// plenty of time for the refresh token request to finish.
const REFRESH_BUFFER = 60e3;

const INITIALIZED = 'user/INITIALIZED';
const LOGIN_SUCCESS = 'user/LOGIN_SUCCESS';
const LOGOUT = 'user/LOGOUT';
let timeoutId: NodeJS.Timeout;

const LOCALSTORAGE_KEY = 'appsembleAuth';

interface UserState {
  initialized: boolean;
  user: User;
  role: string;
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
  sub: number;
  iss: string;
}

interface Member {
  id: number;
  name: string;
  primaryEmail: string;
  role: string;
}

export const initialState: UserState = {
  initialized: false,
  user: null,
  role: undefined,
};

interface InitializeAction extends Action<typeof INITIALIZED> {
  user: User;
  role: string;
}

interface LoginSuccessAction extends Action<typeof LOGIN_SUCCESS> {
  user: User;
  role: string;
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
        role: action.role,
      };
    case LOGIN_SUCCESS:
      return {
        ...state,
        user: action.user,
        role: action.role,
      };
    case LOGOUT:
      return {
        ...state,
        user: null,
        role: null,
      };
    default:
      return state;
  }
};

async function doLogout(dispatch: UserDispatch): Promise<void> {
  delete axios.defaults.headers.common.Authorization;
  clearTimeout(timeoutId);
  localStorage.removeItem(LOCALSTORAGE_KEY);
  dispatch({
    type: LOGOUT,
  });
}

async function setupAuth(
  accessToken: string,
  refreshToken: string,
  url: string,
  dispatch: UserDispatch,
): Promise<User> {
  const payload = jwtDecode<JwtPayload>(accessToken);
  const { exp, scopes, sub, iss } = payload;
  if (exp) {
    const timeout = exp * 1e3 - REFRESH_BUFFER - new Date().getTime();
    if (refreshToken) {
      timeoutId = setTimeout(() => {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        refreshTokenLogin(url, dispatch);
      }, timeout);
    } else {
      timeoutId = setTimeout(() => {
        doLogout(dispatch);
      }, timeout);
    }
  }
  axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

  let userInfo: UserInfo;

  try {
    const { data } = await axios.get<UserInfo>(`${iss}/api/connect/userinfo`);
    userInfo = data;
  } catch (exception) {
    // do nothing, userinfo endpoint is not available
  }

  return {
    scope: scopes,
    ...userInfo,
    sub,
  };
}

async function requestToken(
  url: string,
  params: OAuth2Params,
  dispatch: UserDispatch,
  refreshURL: string,
): Promise<User> {
  const { data } = await axios.post(url, new URLSearchParams(params as Record<string, any>));
  const { access_token: accessToken, refresh_token: refreshToken } = data;
  localStorage.setItem(
    LOCALSTORAGE_KEY,
    JSON.stringify({
      accessToken,
      refreshToken,
      clientId: params.client_id,
      clientSecret: params.client_secret,
    }),
  );
  return setupAuth(accessToken, refreshToken, refreshURL || url, dispatch);
}

async function refreshTokenLogin(url: string, dispatch: UserDispatch): Promise<void> {
  try {
    const { refreshToken, clientId, clientSecret } = JSON.parse(
      localStorage.getItem(LOCALSTORAGE_KEY),
    );
    let role = null;
    const user = await requestToken(
      url,
      {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        ...(clientId && { client_id: clientId }),
        ...(clientSecret && { client_secret: clientSecret }),
      },
      dispatch,
      url,
    );

    if (settings.definition.security !== undefined) {
      ({
        data: { role },
      } = await axios.get<Member>(`/api/apps/${settings.id}/members/${user.sub}`));
    }

    dispatch({
      type: LOGIN_SUCCESS,
      user,
      role,
    });
  } catch (error) {
    doLogout(dispatch);
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
    const { app } = getState();

    const token = JSON.parse(localStorage.getItem(LOCALSTORAGE_KEY));
    let user = null;
    let role = null;

    if (token != null) {
      const auth = (authentication ||
        app.definition.authentication ||
        app.definition.authentication[0]) as Authentication;
      user = await setupAuth(
        token.accessToken,
        token.refreshToken,
        auth.refreshURL || auth.url,
        dispatch,
      );

      if (app.definition.security !== undefined) {
        ({
          data: { role },
        } = await axios.get<Member>(`/api/apps/${settings.id}/members/${user.sub}`));
      }
    }

    dispatch({
      type: INITIALIZED,
      user,
      role,
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
    const { app } = getState();
    let role = null;
    const user = await requestToken(
      url,
      {
        grant_type: 'password',
        username,
        password,
        ...(clientId && { client_id: clientId }),
        ...(scope && { scope }),
      },
      dispatch,
      refreshURL,
    );

    if (app.definition.security !== undefined) {
      ({
        data: { role },
      } = await axios.get<Member>(`/api/apps/${settings.id}/members/${user.sub}`));
    }

    dispatch({
      type: LOGIN_SUCCESS,
      user,
      role,
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
    const { app } = getState();
    let role = null;
    const user = await requestToken(
      url,
      {
        grant_type: 'authorization_code',
        code: token,
        client_id: clientId,
        client_secret: clientSecret,
        scope,
      },
      dispatch,
      refreshURL,
    );

    if (app.definition.security !== undefined) {
      ({
        data: { role },
      } = await axios.get<Member>(`/api/apps/${settings.id}/members/${user.sub}`));
    }

    dispatch({ type: LOGIN_SUCCESS, user, role });
  };
}
