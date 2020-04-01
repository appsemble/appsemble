const actual: typeof import('crypto') = jest.requireActual('crypto');

/**
 * This mock ensures {@link crypto#randomBytes} always returns a predictable result.
 */
module.exports = {
  ...actual,
  randomBytes: (size: number) => Buffer.alloc(size),
} as typeof actual;
