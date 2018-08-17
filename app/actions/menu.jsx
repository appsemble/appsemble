const OPEN = 'menu/OPEN';
const CLOSE = 'menu/CLOSE';


const initialState = {
  isOpen: false,
};


export default function menuReducer(state = initialState, action) {
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
}


export function openMenu() {
  return (dispatch) => {
    dispatch({
      type: OPEN,
    });
  };
}


export function closeMenu() {
  return (dispatch) => {
    dispatch({
      type: CLOSE,
    });
  };
}
