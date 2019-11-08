import { UniqueMessage } from '@appsemble/react-components';
import { Message } from '@appsemble/types';
import { Action } from 'redux';
import { ThunkAction } from 'redux-thunk';

const PUSH = 'message/PUSH';
const REMOVE = 'message/REMOVE';

interface MessageState {
  queue: UniqueMessage[];
  counter: number;
}

const initialState: MessageState = {
  queue: [],
  counter: 0,
};

interface PushAction extends Action<typeof PUSH> {
  message: Message;
}

interface RemoveAction extends Action<typeof REMOVE> {
  message: UniqueMessage;
}

type MessageAction = PushAction | RemoveAction;
type MessageThunk = ThunkAction<void, MessageState, null, MessageAction>;

export default (state: MessageState = initialState, action: MessageAction): MessageState => {
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

export function push(message: Message | string): MessageThunk {
  const payload = typeof message === 'string' ? { body: message } : message;

  return dispatch => {
    dispatch({
      type: PUSH,
      message: payload,
    });
  };
}

export function remove(message: UniqueMessage): MessageThunk {
  return dispatch => {
    dispatch({
      type: REMOVE,
      message,
    });
  };
}
