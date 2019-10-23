import createMockStore, { MockStoreEnhanced } from 'redux-mock-store';
import thunk, { ThunkDispatch } from 'redux-thunk';

import * as getDB from '../utils/getDB';
import reducer, {
  AppAction,
  AppState,
  GET_ERROR,
  GET_START,
  GET_SUCCESS,
  getApp,
  initialState,
} from './app';

const emptyApp: any = {
  id: 1,
  organizationId: 'foo',
  definition: {
    defaultPage: '',
    authentication: [],
    pages: [],
    resources: {},
  },
};

jest.mock('../utils/settings', () => ({
  __esModule: true,
  default: {
    id: 1,
    organizationId: 'foo',
    definition: {
      defaultPage: '',
      authentication: [],
      pages: [],
      resources: {},
    },
  },
}));

let store: MockStoreEnhanced<AppState, ThunkDispatch<AppState, undefined, AppAction>>;

beforeEach(() => {
  store = createMockStore<AppState, ThunkDispatch<AppState, undefined, AppAction>>([thunk])(
    initialState,
  );
});

describe('reducer', () => {
  it('should return the default state', () => {
    const result = reducer(undefined, ({} as unknown) as AppAction);
    expect(result).toStrictEqual(initialState);
  });

  it('should handle GET_START actions', () => {
    const result = reducer(
      {
        definition: emptyApp.definition,
        error: Error('Beep'),
      },
      { type: GET_START },
    );

    expect(result).toStrictEqual(initialState);
  });

  it('should handle GET_ERROR actions', () => {
    const result = reducer(initialState, { type: GET_ERROR, error: Error('Example') });

    expect(result).toStrictEqual({
      definition: null,
      error: Error('Example'),
    });
  });

  it('should handle GET_SUCCESS actions', () => {
    const result = reducer(initialState, {
      type: GET_SUCCESS,
      db: null,
      definition: emptyApp.definition,
    });

    expect(result).toStrictEqual({ definition: emptyApp.definition, error: null });
  });

  it('should handle EDIT_SUCCESS actions', () => {
    const result = reducer(
      { definition: emptyApp.definition, error: null },
      {
        type: 'editor/EDIT_SUCCESS',
        definition: {
          ...emptyApp.definition,
          pages: [{ name: 'Test Page', blocks: [] }],
        },
      },
    );

    expect(result).toStrictEqual({
      error: null,
      definition: { ...emptyApp.definition, pages: [{ name: 'Test Page', blocks: [] }] },
    });
  });
});

describe('getApp', () => {
  it('should create getApp actions when app does not exist', async () => {
    const error = Error('This is a test error');
    const spy = jest.spyOn(getDB, 'default');
    spy.mockRejectedValue(error);

    await store.dispatch(getApp());
    const actions = store.getActions();

    expect(actions).toStrictEqual([
      { type: GET_START },
      {
        type: GET_ERROR,
        error,
      },
    ]);
  });

  it('should create getApp actions when app exists', async () => {
    const spy = jest.spyOn(getDB, 'default');
    spy.mockResolvedValue({} as any);

    await store.dispatch(getApp());
    const actions = store.getActions();

    expect(actions).toStrictEqual([
      { type: GET_START },
      {
        type: GET_SUCCESS,
        db: {},
        definition: emptyApp.definition,
      },
    ]);

    // This is expected to call settings.id
    expect(spy).toHaveBeenCalledWith(emptyApp.id);
    spy.mockRestore();
  });
});
