import axios from 'axios';

import getDB from '../utils/getDB';
import resolveJsonPointers from '../utils/resolveJsonPointers';


const GET_START = 'app/GET_START';
const GET_SUCCESS = 'app/GET_SUCCESS';
const GET_ERROR = 'app/GET_ERROR';


const initialState = {
  app: null,
  db: null,
  error: null,
};


export default (state = initialState, action) => {
  switch (action.type) {
    case GET_START:
      return {
        ...state,
        app: null,
        db: null,
        error: null,
      };
    case GET_SUCCESS:
      return {
        ...state,
        app: action.app,
        db: action.db,
        error: null,
      };
    case GET_ERROR:
      return {
        ...state,
        app: null,
        db: null,
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
    const { data } = await axios.get(`/api/apps/${document.baseURI.match(/\d+$/)[0]}`);
    const app = resolveJsonPointers(data);
    const db = await getDB(app);
    dispatch({
      type: GET_SUCCESS,
      app,
      db,
    });
  } catch (error) {
    dispatch({
      type: GET_ERROR,
      error,
    });
  }
};
