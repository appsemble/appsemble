import { identity, rethrow, stripNullValues } from './miscellaneous';

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

describe('stripNullValues', () => {
  it('should convert null to undefined', () => {
    const input: unknown = null;
    expect(stripNullValues(input)).toBeUndefined();
  });

  it('should return raw primitives', () => {
    const input = 42;
    expect(stripNullValues(input)).toBe(42);
  });

  it('should remove empty, undefined, and null from arrays', () => {
    const input: unknown = [, undefined, null];
    expect(stripNullValues(input)).toStrictEqual([]);
  });

  it('should remove undefined, and null values from objects', () => {
    const input: unknown = {
      foo: null,
      bar: undefined,
      baz: 42,
    };
    expect(stripNullValues(input)).toStrictEqual({ baz: 42 });
  });

  it('should remove empty, undefined, and null values recursively', () => {
    const input: unknown = {
      foo: {
        bar: {
          fooz: null,
          baz: [, undefined, null],
        },
      },
    };
    expect(stripNullValues(input)).toStrictEqual({ foo: { bar: { baz: [] } } });
  });

  it('should respect depth for objects', () => {
    const input: unknown = {
      foo: {
        bar: {
          asd: null,
        },
        baz: null,
      },
      fooz: null,
    };
    expect(stripNullValues(input, { depth: 2 })).toStrictEqual({ foo: { bar: { asd: null } } });
  });

  it('should respect depth for arrays', () => {
    const input: unknown = [null, [null, [null]]];
    expect(stripNullValues(input, { depth: 2 })).toStrictEqual([[[null]]]);
  });
});
