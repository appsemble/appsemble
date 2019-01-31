const PUSH = 'message/PUSH';
const REMOVE = 'message/REMOVE';

const initialState = {
  queue: [],
  counter: 0,
};

export default (state = initialState, action) => {
  switch (action.type) {
    case PUSH:
      return {
        queue: [...state.queue, { ...action.message, id: state.counter + 1 }],
        counter: state.counter + 1,
      };
    case REMOVE:
      return {
        queue: state.queue.filter(message => message.id !== action.message.id),
        counter: state.counter,
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

export function remove(message) {
  return dispatch => {
    dispatch({
      type: REMOVE,
      message,
    });
  };
}
