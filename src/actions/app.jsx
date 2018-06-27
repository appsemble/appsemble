import axios from 'axios';

import appDefinition from '../../apps/unlittered/app.yaml';


const GET_START = 'app/GET_START';
const GET_SUCCESS = 'app/GET_SUCCESS';
const GET_ERROR = 'app/GET_ERROR';


const initialState = {
  app: null,
  error: null,
};


export default (state = initialState, action) => {
  switch (action.type) {
    case GET_START:
      return {
        ...state,
        app: null,
        error: null,
      };
    case GET_SUCCESS:
      return {
        ...state,
        app: action.app,
        error: null,
      };
    case GET_ERROR:
      return {
        ...state,
        app: null,
        error: action.error,
      };
    default:
      return state;
  }
};


export const getApp = () => async (dispatch) => {
  dispatch({
    type: GET_START,
  });
  try {
    const { data } = await axios.get(appDefinition);
    dispatch({
      type: GET_SUCCESS,
      app: data,
    });
  } catch (error) {
    dispatch({
      type: GET_ERROR,
      error,
    });
  }
};
