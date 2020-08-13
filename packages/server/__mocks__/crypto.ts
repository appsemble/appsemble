const actual = jest.requireActual<typeof import('crypto')>('crypto');

/**
 * This mock ensures {@link crypto#randomBytes} always returns a predictable result.
 */
export = {
  ...actual,
  randomBytes: (size: number) => Buffer.alloc(size),
} as typeof actual;
