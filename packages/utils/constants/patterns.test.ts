import { describe, expect, it } from 'vitest';

import {
  domainPattern,
  emailPattern,
  googleAnalyticsIDPattern,
  normalized,
  partialNormalized,
} from './patterns.js';

describe('partialNormalized', () => {
  it.each([
    ['Ffoo', 'foo'],
    ['barB', 'bar'],
    ['I am victorous', 'am'],
  ])('should match %j as %j', (input, expected) => {
    const match = input.match(partialNormalized);
    expect(match).not.toBeNull();
    expect(match).toHaveLength(2);
    expect([...match!]).toStrictEqual([expected, expected]);
  });

  it('should be reusable to compose a new regular expression', () => {
    const composed = new RegExp(`^@${partialNormalized.source}/${partialNormalized.source}$`);
    const match = '@foo/bar'.match(composed);
    expect(match).not.toBeNull();
    expect(match).toHaveLength(3);
    expect([...match!]).toStrictEqual(['@foo/bar', 'foo', 'bar']);
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
  ])('should match %j', (string) => {
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
  ])('should not match %j', (string) => {
    expect(string).not.toMatch(normalized);
  });
});

describe('domainPattern', () => {
  it.each([
    'example.com',
    'valid.com',
    'definitely.valid.org',
    'a.nl',
    'very.deeply.nested.domain.name.example',
  ])('should match %j', (string) => {
    expect(string).toMatch(domainPattern);
  });

  it.each([
    'a',
    'a.a',
    '.com',
    '-.de',
    'valid.ínválíd.com',
    'example.COM',
    'EXAMPLE.com',
    'EXAMPLE.COM',
    'This is a random string',
  ])('should not match %j', (string) => {
    expect(string).not.toMatch(domainPattern);
  });
});

describe('googleAnalyticsIDPattern', () => {
  it.each(['', 'UA-12345678-9', 'G-0123456789ABC', 'UA-211654446-1'])(
    'should match %j',
    (string) => {
      expect(string).toMatch(googleAnalyticsIDPattern);
    },
  );

  it.each([' ', 'AU-123456789-0', 'UA-123-123', 'UA-1234-12345', 'G-012345678abc'])(
    'should not match %j',
    (string) => {
      expect(string).not.toMatch(googleAnalyticsIDPattern);
    },
  );
});

describe('emailPattern', () => {
  it.each(['name@domain.com', '1@1.c'])('should match %j', (string) => {
    expect(string).toMatch(emailPattern);
  });

  it.each(['@domain.com', 'name@.com', 'name@domain'])('should not match %j', (string) => {
    expect(string).not.toMatch(emailPattern);
  });
});
