const actual = jest.requireActual('os');

/**
 * This mock ensures the values of `os` are consistent across platforms in tests.
 */
export = {
  ...actual,
  type: () => 'Linux',
  arch: () => 'x64',
};
