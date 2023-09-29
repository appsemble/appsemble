import { describe, expect, it } from 'vitest';

import { camelToHyphen, decodeJSONRef, toUpperCase } from './string.js';

describe('camelToHyphen', () => {
  it('should convert camel case to hyphenated', () => {
    const result = camelToHyphen('iAmAString');
    expect(result).toBe('i-am-a-string');
  });
});

describe('toUpperCase', () => {
  it('should convert a string to upper case', () => {
    expect(toUpperCase('hello')).toBe('HELLO');
  });
});

describe('decodeJSONRef', () => {
  const tests = [
    ['foo~1bar', 'foo/bar'],
    ['foo~0bar', 'foo~bar'],
    ['foo~0~1bar', 'foo~/bar'],
    ['foo~1~0bar', 'foo/~bar'],
    ['Record%3Cstring%2Cnumber%3E', 'Record<string,number>'],
  ];

  it.each(tests)('%s → %s', (unescaped, escaped) => {
    const result = decodeJSONRef(unescaped);
    expect(result).toBe(escaped);
  });
});
