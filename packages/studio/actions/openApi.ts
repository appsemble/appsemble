import axios from 'axios';
import RefParser, { JSONSchema } from 'json-schema-ref-parser';
import { Action } from 'redux';
import { ThunkAction } from 'redux-thunk';

import { State } from '.';

const GET_START = 'openapi/GET_START';
const GET_SUCCESS = 'openapi/GET_SUCCESS';
const GET_ERROR = 'openapi/GET_ERROR';

export interface OpenAPIState {
  spec: JSONSchema;
  loading: boolean;
  error: Error;
}

const initialState: OpenAPIState = {
  spec: null,
  loading: false,
  error: null,
};

interface SuccessAction extends Action<typeof GET_SUCCESS> {
  spec: JSONSchema;
}

interface ErrorAction extends Action<typeof GET_ERROR> {
  error: Error;
}

type OpenAPIAction = SuccessAction | Action<typeof GET_START> | ErrorAction;
type OpenAPIThunk = ThunkAction<void, State, null, OpenAPIAction>;

export default (state = initialState, action: OpenAPIAction): OpenAPIState => {
  switch (action.type) {
    case GET_START:
      return { ...initialState, loading: true };
    case GET_SUCCESS:
      return {
        spec: action.spec,
        loading: false,
        error: null,
      };
    case GET_ERROR:
      return {
        spec: null,
        loading: false,
        error: action.error,
      };
    default:
      return state;
  }
};

export function getOpenApiSpec(): OpenAPIThunk {
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
