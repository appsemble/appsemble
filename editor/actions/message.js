const PUSH = 'message/PUSH';
const SHIFT = 'message/SHIFT';

const initialState = {
  queue: [],
};

export default (state = initialState, action) => {
  switch (action.type) {
    case PUSH:
      return {
        queue: [...state.queue, action.message],
      };
    case SHIFT:
      return {
        queue: state.queue.slice(0, state.queue.length - 1),
      };
    default:
      return state;
  }
};

export function push(message) {
  const payload = typeof message === 'string' ? { body: message } : message;

  return dispatch => {
    dispatch({
      type: PUSH,
      message: payload,
    });
  };
}

export function shift() {
  return dispatch => {
    dispatch({
      type: SHIFT,
    });
  };
}
