import { Block, BlockDefinition } from '@appsemble/types';
import axios from 'axios';
import { Action } from 'redux';
import { ThunkAction } from 'redux-thunk';

import { blockToString, normalizeBlockName } from '../utils/blockUtils';

const GET_START = 'blockDefs/GET_START';
const GET_SUCCESS = 'blockDefs/GET_SUCCESS';
const GET_ERROR = 'blockDefs/GET_ERROR';

interface BlockDefState {
  blockDefs: Record<string, BlockDefinition>;
  errored: Set<string>;
  pending: Block[];
}

export const initialState: BlockDefState = {
  blockDefs: {},
  errored: new Set(),
  pending: [],
};

interface StartAction extends Action<typeof GET_START> {
  pending: Block[];
}

interface SuccessAction extends Action<typeof GET_SUCCESS> {
  blockDef: BlockDefinition;
}

interface ErrorAction extends Action<typeof GET_ERROR> {
  blockDefId: string;
}

export type BlockDefAction = StartAction | SuccessAction | ErrorAction;
type BlockDefThunk = ThunkAction<void, BlockDefState, null, BlockDefAction>;

export default (state = initialState, action: BlockDefAction): BlockDefState => {
  switch (action.type) {
    case GET_START:
      return {
        ...state,
        pending: [...state.pending, ...action.pending],
      };
    case GET_SUCCESS:
      return {
        ...state,
        blockDefs: {
          ...state.blockDefs,
          [`${action.blockDef.name}@${action.blockDef.version}`]: action.blockDef,
        },
        pending: [],
      };
    case GET_ERROR:
      return {
        ...state,
        blockDefs: {},
        errored: new Set([...state.errored, action.blockDefId]),
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
export function getBlockDefs(blocks: Block[]): BlockDefThunk {
  return async (dispatch, getState) => {
    const state = getState().blockDefs;
    const filtered = blocks.filter(
      block => !Object.prototype.hasOwnProperty.call(state.blockDefs, blockToString(block)),
    );
    if (filtered.length === 0) {
      return;
    }
    dispatch({
      type: GET_START,
      pending: filtered,
    });
    filtered.forEach(async block => {
      try {
        const { data: blockDef } = await axios.get(
          `/api/blocks/${normalizeBlockName(block.type)}/versions/${block.version}`,
        );
        dispatch({
          type: GET_SUCCESS,
          blockDef,
        });
      } catch (error) {
        dispatch({
          type: GET_ERROR,
          blockDefId: blockToString(block),
        });
      }
    });
  };
}
