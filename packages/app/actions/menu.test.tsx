import reducer, { initialState, MenuAction } from './menu';

describe('Menu Redux', () => {
  it('should return the default state', () => {
    expect(reducer(undefined, ({} as unknown) as MenuAction)).toStrictEqual(initialState);
  });

  it('handles OPEN actions', () => {
    expect(reducer(initialState, { type: 'menu/OPEN' })).toStrictEqual({ isOpen: true });
  });

  it('handles CLOSE actions', () => {
    expect(reducer({ isOpen: true }, { type: 'menu/CLOSE' })).toStrictEqual({ isOpen: false });
  });
});
