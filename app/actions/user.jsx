import axios from 'axios';
import jwtDecode from 'jwt-decode';


// The buffer between the access token expiration and the refresh token request. A minute should be
// plenty of time for the refresh token request to finish.
const REFRESH_BUFFER = 60e3;


const LOGIN_SUCCESS = 'user/LOGIN_SUCCESS';
const LOGOUT = 'user/LOGOUT';
let timeoutId;


const initialState = {
  user: null,
};


export default (state = initialState, action) => {
  switch (action.type) {
    case LOGIN_SUCCESS:
      return {
        ...state,
        user: action.user,
      };
    case LOGOUT:
      return initialState;
    default:
      return state;
  }
};


async function doLogout(dispatch, getState, db = getState().app.db) {
  delete axios.defaults.headers.common.Authorization;
  clearTimeout(timeoutId);
  db.transaction('auth', 'readwrite').objectStore('auth').delete(0);
  dispatch({
    type: LOGOUT,
  });
}


async function requestToken(url, params, db, dispatch, refreshURL) {
  const { data } = await axios.post(url, new URLSearchParams(params));
  const {
    access_token: accessToken,
    refresh_token: refreshToken,
  } = data;
  const payload = jwtDecode(accessToken);
  const tx = db.transaction('auth', 'readwrite');
  tx.objectStore('auth').put({
    accessToken,
    refreshToken,
  }, 0);
  const { exp, scopes, sub } = payload;
  if (exp) {
    const timeout = (exp * 1e3) - REFRESH_BUFFER - new Date().getTime();
    if (refreshToken) {
      // eslint-disable-next-line no-use-before-define
      timeoutId = setTimeout(refreshTokenLogin, timeout, refreshURL || url, db, dispatch);
    } else {
      timeoutId = setTimeout(doLogout, timeout, dispatch, null, db);
    }
  }
  axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
  return {
    user: {
      id: sub,
      scope: scopes,
    },
  };
}


async function refreshTokenLogin(url, db, dispatch) {
  const { refreshToken } = await db.transaction('auth').objectStore('auth').get(0);
  try {
    const auth = await requestToken(url, {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }, db, dispatch);
    dispatch({
      type: LOGIN_SUCCESS,
      ...auth,
    });
  } catch (error) {
    doLogout(dispatch, null, db);
  }
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
 */
export function passwordLogin(url, { username, password }, refreshURL) {
  return async (dispatch, getState) => {
    const { db } = getState().app;
    const auth = await requestToken(url, {
      grant_type: 'password',
      username,
      password,
    }, db, dispatch, refreshURL, dispatch);
    dispatch({
      type: LOGIN_SUCCESS,
      ...auth,
    });
  };
}
