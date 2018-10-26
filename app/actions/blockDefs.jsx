import axios from 'axios';

const GET_START = 'blockDefs/GET_START';
const GET_SUCCESS = 'blockDefs/GET_SUCCESS';
const GET_ERROR = 'blockDefs/GET_ERROR';

const initialState = {
  blockDefs: [],
  error: null,
  pending: [],
};

export default (state = initialState, action) => {
  switch (action.type) {
    case GET_START:
      return {
        ...state,
        error: null,
        pending: [...state.pending, ...action.pending],
      };
    case GET_SUCCESS:
      return {
        ...state,
        blockDefs: [...state.blockDefs, action.blockDef],
        error: null,
      };
    case GET_ERROR:
      return {
        ...state,
        blockDefs: [],
        error: action.error,
      };
    default:
      return state;
  }
};

/**
 * Fetch the block definitions for the given ids.
 *
 * @param {string[]} blockDefIds The ids of the block definitions to fetch.
 */
export function getBlockDefs(blockDefIds) {
  return async (dispatch, getState) => {
    const state = getState().blockDefs;
    const filtered = blockDefIds.filter((blockDefId, index) => {
      if (index !== blockDefIds.indexOf(blockDefId)) {
        return false;
      }
      if (state.pending.includes(blockDefId)) {
        return false;
      }
      return !state.blockDefs.find(blockDef => blockDef.id === blockDefId);
    });
    if (filtered.length === 0) {
      return;
    }
    dispatch({
      type: GET_START,
      pending: filtered,
    });
    try {
      await Promise.all(
        blockDefIds.map(async blockDefId => {
          const { data: blockDef } = await axios.get(`${blockDefId}/block.json`);
          dispatch({
            type: GET_SUCCESS,
            blockDef,
          });
        }),
      );
    } catch (error) {
      dispatch({
        type: GET_ERROR,
        error,
      });
    }
  };
}
