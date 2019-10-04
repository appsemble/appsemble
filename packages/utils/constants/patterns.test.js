import { normalized } from './patterns';

describe('normalized', () => {
  it.each([
    'foo',
    'bar',
    'a',
    'ab',
    'hyphenated-string',
    'multi-hyphenated-string',
    '1',
    '10-second-move',
    '13-37',
  ])('should match %s', string => {
    expect(string).toMatch(normalized);
  });

  it.each([
    'Uppercase',
    'uppercasE',
    'camelCase',
    'double--hyphen',
    'trouble--double--hyphen',
    'triple---hyphen',
    'under_score',
    'aććëņtèd',
    '🐱',
  ])('should not match %s', string => {
    expect(string).not.toMatch(normalized);
  });
});
