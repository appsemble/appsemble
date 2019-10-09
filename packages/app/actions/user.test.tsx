import reducer, { initialState, UserAction } from './user';

describe('User Redux', () => {
  it('should return the default state', () => {
    expect(reducer(undefined, ({} as unknown) as UserAction)).toStrictEqual(initialState);
  });

  it('should handle LOGIN_SUCCESS actions', () => {
    expect(reducer(initialState, { type: 'user/LOGIN_SUCCESS', user: { id: 1234 } })).toStrictEqual(
      { initialized: false, user: { id: 1234 } },
    );
  });

  it('should handle LOGOUT actions', () => {
    expect(
      reducer({ initialized: true, user: { id: 1234 } }, { type: 'user/LOGOUT' }),
    ).toStrictEqual({ initialized: true, user: null });
  });

  it('should handle INITIALIZED actions', () => {
    expect(reducer(initialState, { type: 'user/INITIALIZED', user: { id: 1234 } })).toStrictEqual({
      initialized: true,
      user: { id: 1234 },
    });
  });
});
