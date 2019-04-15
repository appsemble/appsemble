import axios from 'axios';
import jwtDecode from 'jwt-decode';
import { AUTH, RW } from '@appsemble/utils/getDB';

// The buffer between the access token expiration and the refresh token request. A minute should be
// plenty of time for the refresh token request to finish.
const REFRESH_BUFFER = 60e3;

const INITIALIZED = 'user/INITIALIZED';
const LOGIN_SUCCESS = 'user/LOGIN_SUCCESS';
const LOGOUT = 'user/LOGOUT';
let timeoutId;

const initialState = {
  initialized: false,
  user: null,
};

export default (state = initialState, action) => {
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

async function doLogout(dispatch, getState, db = getState().db) {
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

function setupAuth(accessToken, refreshToken, url, db, dispatch) {
  const payload = jwtDecode(accessToken);
  const { exp, scopes, sub } = payload;
  if (exp) {
    const timeout = exp * 1e3 - REFRESH_BUFFER - new Date().getTime();
    if (refreshToken) {
      // eslint-disable-next-line no-use-before-define
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

async function requestToken(url, params, db, dispatch, refreshURL) {
  const { data } = await axios.post(url, new URLSearchParams(params));
  const { access_token: accessToken, refresh_token: refreshToken } = data;
  const tx = db.transaction(AUTH, RW);
  await tx.objectStore(AUTH).put(
    {
      accessToken,
      refreshToken,
    },
    0,
  );
  return setupAuth(accessToken, refreshToken, refreshURL || url, db, dispatch);
}

async function refreshTokenLogin(url, db, dispatch) {
  const { refreshToken } = await db
    .transaction(AUTH)
    .objectStore(AUTH)
    .get(0);
  try {
    const user = await requestToken(
      url,
      {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
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
export function initAuth(authentication) {
  return async (dispatch, getState) => {
    const { db, ...state } = getState();
    const token = await db
      .transaction(AUTH)
      .objectStore(AUTH)
      .get(0);
    let user = null;
    if (token != null) {
      const auth =
        authentication || state.app.app.authentication || state.app.app.authentication[0];
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
export function logout() {
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
export function passwordLogin(url, { username, password }, refreshURL, clientId, scope) {
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
      dispatch,
    );
    dispatch({
      type: LOGIN_SUCCESS,
      user,
    });
  };
}

export function oauthLogin(url, token, refreshToken, refreshURL, clientId, clientSecret, scope) {
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
      dispatch,
    );

    dispatch({ type: LOGIN_SUCCESS, user });
  };
}
