const OPEN = 'menu/OPEN';
const CLOSE = 'menu/CLOSE';

const initialState = {
  isOpen: false,
};

export default (state = initialState, action) => {
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
export function openMenu() {
  return dispatch => {
    dispatch({
      type: OPEN,
    });
  };
}

/**
 * Close the side menu.
 */
export function closeMenu() {
  return dispatch => {
    dispatch({
      type: CLOSE,
    });
  };
}
