import reducer, { AppAction, GET_ERROR, GET_START, GET_SUCCESS, initialState } from './app';

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
