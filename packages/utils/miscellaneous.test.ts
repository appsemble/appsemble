import { describe, expect, it } from 'vitest';

import { has, identity, rethrow } from './miscellaneous.js';

/**
 * Return the input data.
 *
 * @param data The data to return.
 * @returns The input data.
 */
describe('identity', () => {
  it('should return the input data', () => {
    const input = {};
    expect(identity(input)).toBe(input);
  });
});

/**
 * Throw the input data.
 *
 * @param data The data to throw.
 * @throws The input data.
 */
describe('rethrow', () => {
  it('should throw the input data', () => {
    expect(() => rethrow('Test')).toThrow('Test');
  });
});

describe('has', () => {
  it('should return false for null targets', () => {
    expect(has(null, 'toString')).toBe(false);
  });

  it('should return false for undefined targets', () => {
    expect(has(undefined, 'toString')).toBe(false);
  });

  it('should return false for attributes inferred from the prototype chain', () => {
    expect(has({}, 'toString')).toBe(false);
  });

  it('should return true for own properties', () => {
    expect(has({ toString: null }, 'toString')).toBe(true);
  });
});
