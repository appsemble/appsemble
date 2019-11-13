import axios from 'axios';
import RefParser from 'json-schema-ref-parser';

const GET_START = 'openapi/GET_START';
const GET_SUCCESS = 'openapi/GET_SUCCESS';
const GET_ERROR = 'openapi/GET_ERROR';

const initialState = {
  spec: null,
  loading: false,
  error: null,
};

export default (state = initialState, action) => {
  switch (action.type) {
    case GET_START:
      return initialState;
    case GET_SUCCESS:
      return {
        spec: action.spec,
        error: null,
      };
    case GET_ERROR:
      return {
        spec: null,
        error: action.error,
      };
    default:
      return state;
  }
};

export function getOpenApiSpec() {
  return async (dispatch, getState) => {
    const { loading } = getState().openApi;
    if (loading) {
      return;
    }
    dispatch({
      type: GET_START,
    });
    try {
      const { data } = await axios.get('/api.json');
      const spec = await RefParser.dereference(data);
      dispatch({
        type: GET_SUCCESS,
        spec,
      });
    } catch (error) {
      dispatch({
        type: GET_ERROR,
        error,
      });
    }
  };
}
