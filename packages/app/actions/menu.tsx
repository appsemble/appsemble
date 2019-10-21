import { Action } from 'redux';
import { ThunkAction } from 'redux-thunk';

const OPEN = 'menu/OPEN';
const CLOSE = 'menu/CLOSE';

export interface MenuState {
  isOpen: boolean;
}

export const initialState: MenuState = {
  isOpen: false,
};

export type MenuAction = Action<typeof OPEN> | Action<typeof CLOSE>;
type MenuThunk = ThunkAction<void, MenuState, null, MenuAction>;

export default (state = initialState, action: MenuAction): MenuState => {
  switch (action.type) {
    case OPEN:
      return {
        isOpen: true,
      };
    case CLOSE:
      return {
        isOpen: false,
      };
    default:
      return state;
  }
};

/**
 * Open the side menu.
 */
export function openMenu(): MenuThunk {
  return dispatch => {
    dispatch({
      type: OPEN,
    });
  };
}

/**
 * Close the side menu.
 */
export function closeMenu(): MenuThunk {
  return dispatch => {
    dispatch({
      type: CLOSE,
    });
  };
}
