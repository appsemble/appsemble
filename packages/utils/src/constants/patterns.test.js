import { normalized, partialNormalized } from './patterns';

describe('partialNormalized', () => {
  it.each([
    ['Ffoo', 'foo'],
    ['barB', 'bar'],
    ['I am victorous', 'am'],
  ])('should match %j as %j', (input, expected) => {
    const match = input.match(partialNormalized);
    expect(match).not.toBeNull();
    expect(match).toHaveLength(2);
    expect(Array.from(match)).toStrictEqual([expected, expected]);
  });

  it('should be reusable to compose a new regular expression', () => {
    const composed = new RegExp(`^@${partialNormalized.source}/${partialNormalized.source}$`);
    const match = '@foo/bar'.match(composed);
    expect(match).not.toBeNull();
    expect(match).toHaveLength(3);
    expect(Array.from(match)).toStrictEqual(['@foo/bar', 'foo', 'bar']);
  });
});

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
  ])('should match %j', string => {
    expect(string).toMatch(normalized);
  });

  it.each([
    '-',
    'Uppercase',
    'uppercasE',
    'camelCase',
    'double--hyphen',
    'trouble--double--hyphen',
    'triple---hyphen',
    'under_score',
    'aććëņtèd',
    '🐱',
  ])('should not match %j', string => {
    expect(string).not.toMatch(normalized);
  });
});
