import { camelToHyphen, toUpperCase } from './string';

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
