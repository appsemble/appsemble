import reducer, { initialState, UserAction } from './user';

describe('reducer', () => {
  it('should return the default state', () => {
    const result = reducer(undefined, ({} as unknown) as UserAction);
    expect(result).toStrictEqual(initialState);
  });

  it('should handle LOGIN_SUCCESS actions', () => {
    const result = reducer(initialState, {
      type: 'user/LOGIN_SUCCESS',
      user: { id: '1234', primaryEmail: null, scope: 'apps:read' },
      role: null,
    });
    expect(result).toStrictEqual({
      initialized: false,
      user: { id: '1234', primaryEmail: null, scope: 'apps:read' },
      role: null,
    });
  });

  it('should handle LOGOUT actions', () => {
    const result = reducer(
      {
        initialized: true,
        user: { id: '1234', primaryEmail: null, scope: 'apps:read' },
        role: 'Test',
      },
      { type: 'user/LOGOUT' },
    );
    expect(result).toStrictEqual({ initialized: true, user: null, role: null });
  });

  it('should handle INITIALIZED actions', () => {
    const result = reducer(initialState, {
      type: 'user/INITIALIZED',
      user: { id: '1234', primaryEmail: null, scope: 'apps:read' },
      role: null,
    });
    expect(result).toStrictEqual({
      initialized: true,
      user: { id: '1234', primaryEmail: null, scope: 'apps:read' },
      role: null,
    });
  });
});
