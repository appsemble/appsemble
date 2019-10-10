import createMockStore, { MockStoreEnhanced } from 'redux-mock-store';
import thunk, { ThunkDispatch } from 'redux-thunk';

import reducer, { initialState, MessageAction, MessageState, push, remove } from './message';

describe('Message Redux', () => {
  let store: MockStoreEnhanced<MessageState, ThunkDispatch<MessageState, undefined, MessageAction>>;

  beforeEach(() => {
    store = createMockStore<MessageState, ThunkDispatch<MessageState, undefined, MessageAction>>([
      thunk,
    ])(initialState);
  });

  it('should return the default state', () => {
    expect(
      reducer(undefined, ({ type: 'NONEXISTANT ACTION' } as unknown) as MessageAction),
    ).toStrictEqual(initialState);
  });

  it('should handle PUSH actions', () => {
    expect(reducer(undefined, { type: 'message/PUSH', message: { body: 'foo' } })).toStrictEqual({
      counter: 1,
      queue: [{ id: 1, body: 'foo' }],
    });

    expect(
      reducer(
        {
          counter: 1,
          queue: [{ id: 1, body: 'foo' }],
        },
        { type: 'message/PUSH', message: { body: 'foo', color: 'danger', timeout: 1000 } },
      ),
    ).toStrictEqual({
      counter: 2,
      queue: [{ id: 1, body: 'foo' }, { id: 2, body: 'foo', color: 'danger', timeout: 1000 }],
    });
  });

  it('should handle REMOVE actions', () => {
    expect(
      reducer(
        {
          counter: 3,
          queue: [{ id: 1, body: 'foo' }, { id: 2, body: 'foo' }, { id: 3, body: 'foo' }],
        },
        { type: 'message/REMOVE', message: { id: 2, body: 'foo' } },
      ),
    ).toStrictEqual({
      counter: 3,
      queue: [{ id: 1, body: 'foo' }, { id: 3, body: 'foo' }],
    });

    expect(
      reducer(
        {
          counter: 1,
          queue: [{ id: 1, body: 'foo' }],
        },
        { type: 'message/PUSH', message: { body: 'foo', color: 'danger', timeout: 1000 } },
      ),
    ).toStrictEqual({
      counter: 2,
      queue: [{ id: 1, body: 'foo' }, { id: 2, body: 'foo', color: 'danger', timeout: 1000 }],
    });
  });

  it('should create a push action', async () => {
    store.dispatch(push('Foo'));
    expect(store.getActions()[0]).toStrictEqual({
      type: 'message/PUSH',
      message: { body: 'Foo' },
    });
  });

  it('should create a remove action', async () => {
    store.dispatch(remove({ id: 1, body: 'foo' }));
    expect(store.getActions()[0]).toStrictEqual({
      type: 'message/REMOVE',
      message: { id: 1, body: 'foo' },
    });
  });
});
