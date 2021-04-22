import { identity, rethrow } from './miscellaneous';

/**
 * Return the input data.
 *
 * @param data - The data to return.
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
 * @param data - The data to throw.
 * @throws The input data.
 */
describe('rethrow', () => {
  it('should throw the input data', () => {
    expect(() => rethrow('Test')).toThrow('Test');
  });
});
