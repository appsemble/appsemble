import createMockStore, { MockStoreEnhanced } from 'redux-mock-store';
import thunk, { ThunkDispatch } from 'redux-thunk';

import reducer, { initialState, MessageAction, MessageState, push, remove } from './message';

let store: MockStoreEnhanced<MessageState, ThunkDispatch<MessageState, undefined, MessageAction>>;

beforeEach(() => {
  store = createMockStore<MessageState, ThunkDispatch<MessageState, undefined, MessageAction>>([
    thunk,
  ])(initialState);
});

describe('reducer', () => {
  it('should return the default state', () => {
    const result = reducer(undefined, ({ type: 'NONEXISTANT ACTION' } as unknown) as MessageAction);
    expect(result).toStrictEqual(initialState);
  });

  it('should handle PUSH actions', () => {
    const result = reducer(undefined, { type: 'message/PUSH', message: { body: 'foo' } });

    expect(result).toStrictEqual({
      counter: 1,
      queue: [{ id: 1, body: 'foo' }],
    });

    const resultB = reducer(
      {
        counter: 1,
        queue: [{ id: 1, body: 'foo' }],
      },
      { type: 'message/PUSH', message: { body: 'foo', color: 'danger', timeout: 1000 } },
    );

    expect(resultB).toStrictEqual({
      counter: 2,
      queue: [
        { id: 1, body: 'foo' },
        { id: 2, body: 'foo', color: 'danger', timeout: 1000 },
      ],
    });
  });

  it('should handle REMOVE actions', () => {
    const result = reducer(
      {
        counter: 3,
        queue: [
          { id: 1, body: 'foo' },
          { id: 2, body: 'foo' },
          { id: 3, body: 'foo' },
        ],
      },
      { type: 'message/REMOVE', message: { id: 2, body: 'foo' } },
    );

    expect(result).toStrictEqual({
      counter: 3,
      queue: [
        { id: 1, body: 'foo' },
        { id: 3, body: 'foo' },
      ],
    });

    const resultB = reducer(
      {
        counter: 1,
        queue: [{ id: 1, body: 'foo' }],
      },
      { type: 'message/PUSH', message: { body: 'foo', color: 'danger', timeout: 1000 } },
    );

    expect(resultB).toStrictEqual({
      counter: 2,
      queue: [
        { id: 1, body: 'foo' },
        { id: 2, body: 'foo', color: 'danger', timeout: 1000 },
      ],
    });
  });
});

describe('push', () => {
  it('should create a push action', async () => {
    store.dispatch(push('Foo'));
    expect(store.getActions()[0]).toStrictEqual({
      type: 'message/PUSH',
      message: { body: 'Foo' },
    });
  });
});

describe('remove', () => {
  it('should create a remove action', async () => {
    store.dispatch(remove({ id: 1, body: 'foo' }));
    expect(store.getActions()[0]).toStrictEqual({
      type: 'message/REMOVE',
      message: { id: 1, body: 'foo' },
    });
  });
});
