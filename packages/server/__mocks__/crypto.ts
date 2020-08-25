type Crypto = typeof import('crypto');

const actual = jest.requireActual<Crypto>('crypto');

/**
 * This mock ensures {@link crypto#randomBytes} always returns a predictable result.
 */
export = {
  ...actual,
  randomBytes: (size: number) => Buffer.alloc(size),
} as Crypto;
