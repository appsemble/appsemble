import axios from 'axios';


const GET_START = 'GET_START';
const GET_SUCCESS = 'GET_SUCCESS';
const GET_ERROR = 'GET_ERROR';


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
    const app = await axios.get('app.json');
    dispatch({
      type: GET_SUCCESS,
      app,
    });
  } catch (error) {
    dispatch({
      type: GET_ERROR,
      error,
    });
  }
};
