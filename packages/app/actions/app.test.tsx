import { App } from '@appsemble/types';

import reducer, { AppAction, GET_ERROR, GET_START, GET_SUCCESS, initialState } from './app';

describe('App Redux', () => {
  const emptyApp: App = {
    id: 1,
    authentication: [],
    pages: [],
    resources: {},
    theme: {
      dangerColor: '',
      infoColor: '',
      linkColor: '',
      primaryColor: '',
      splashColor: '',
      successColor: '',
      themeColor: '',
      tileLayer: '',
      warningColor: '',
    },
  };
  it('should return the default state', () => {
    expect(reducer(undefined, ({} as unknown) as AppAction)).toStrictEqual(initialState);
  });

  it('should handle GET_START actions', () => {
    expect(
      reducer(
        {
          app: emptyApp,
          error: Error('Beep'),
        },
        { type: GET_START },
      ),
    ).toStrictEqual(initialState);
  });

  it('should handle GET_ERROR actions', () => {
    expect(reducer(initialState, { type: GET_ERROR, error: Error('Example') })).toStrictEqual({
      app: null,
      error: Error('Example'),
    });
  });

  it('should handle GET_SUCCESS actions', () => {
    expect(
      reducer(initialState, {
        type: GET_SUCCESS,
        db: null,
        app: {
          id: 1,
          authentication: [],
          pages: [],
          resources: {},
          theme: {
            dangerColor: '',
            infoColor: '',
            linkColor: '',
            primaryColor: '',
            splashColor: '',
            successColor: '',
            themeColor: '',
            tileLayer: '',
            warningColor: '',
          },
        },
      }),
    ).toStrictEqual({ app: emptyApp, error: null });
  });

  it('should handle EDIT_SUCCESS actions', () => {
    expect(
      reducer(
        { app: emptyApp, error: null },
        {
          type: 'editor/EDIT_SUCCESS',
          app: { ...emptyApp, pages: [{ name: 'Test Page', blocks: [] }] },
        },
      ),
    ).toStrictEqual({
      error: null,
      app: { ...emptyApp, pages: [{ name: 'Test Page', blocks: [] }] },
    });
  });
});
