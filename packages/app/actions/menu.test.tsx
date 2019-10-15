import createMockStore, { MockStoreEnhanced } from 'redux-mock-store';
import thunk, { ThunkDispatch } from 'redux-thunk';

import reducer, { closeMenu, initialState, MenuAction, MenuState, openMenu } from './menu';

let store: MockStoreEnhanced<MenuState, ThunkDispatch<MenuState, undefined, MenuAction>>;

beforeEach(() => {
  store = createMockStore<MenuState, ThunkDispatch<MenuState, undefined, MenuAction>>([thunk])(
    initialState,
  );
});

describe('reducer', () => {
  it('should return the default state', () => {
    const result = reducer(undefined, ({} as unknown) as MenuAction);
    expect(result).toStrictEqual(initialState);
  });

  it('handles OPEN actions', () => {
    const result = reducer(initialState, { type: 'menu/OPEN' });
    expect(result).toStrictEqual({ isOpen: true });
  });

  it('handles CLOSE actions', () => {
    const result = reducer({ isOpen: true }, { type: 'menu/CLOSE' });
    expect(result).toStrictEqual({ isOpen: false });
  });
});

describe('openMenu', () => {
  it('should create an open action', async () => {
    await store.dispatch(openMenu());
    expect(store.getActions()[0]).toStrictEqual({
      type: 'menu/OPEN',
    });
  });
});

describe('closeMenu', () => {
  it('should create a close action', async () => {
    await store.dispatch(closeMenu());
    expect(store.getActions()[0]).toStrictEqual({
      type: 'menu/CLOSE',
    });
  });
});
