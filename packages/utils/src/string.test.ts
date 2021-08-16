import { camelToHyphen } from './string';

describe('camelToHyphen', () => {
  it('should convert camel case to hyphenated', () => {
    const result = camelToHyphen('iAmAString');
    expect(result).toBe('i-am-a-string');
  });
});
