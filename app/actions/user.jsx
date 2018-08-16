import axios from 'axios';


const LOGIN_SUCCESS = 'user/LOGIN_SUCCESS';


const initialState = {
  user: null,
};


export default (state = initialState, action) => {
  switch (action.type) {
    default:
      return state;
  }
};


export const emailLogin = (url, params) => async (dispatch) => {
  const { data } = await axios.post(url, new URLSearchParams(params));
  const { access_token: accessToken, refresh_token: refreshToken } = data;
  if (typeof accessToken !== 'string') {
    throw new Error('Invalid token response');
  }
  localStorage.accessToken = accessToken;
  localStorage.refreshToken = refreshToken;
  dispatch({
    type: LOGIN_SUCCESS,
  });
};
