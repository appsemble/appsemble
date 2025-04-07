import { expect, it } from 'vitest';

import { normalize } from './normalize.js';

const fixtures = [
  ['Foo', 'foo'],
  ['A somewhat long sentence.', 'a-somewhat-long-sentence'],
  ['Ĺòt’s øf wəìŕð ćĥâṙąçṫœ®ş', 'lot-s-f-w-ir-charact-s'],
  ['I___contain_underscores', 'i-contain-underscores'],
  ['many----hyphens', 'many-hyphens'],
  ['includes.dot', 'includes-dot'],
  ['trailing-hyphen-', 'trailing-hyphen'],
  ['0123456789 digits', '0123456789-digits'],
  ['-leading-hyphen', 'leading-hyphen'],
  ['*-multiple-leading-non-word-characters', 'multiple-leading-non-word-characters'],
];

it.each(fixtures)('should turn “%s” into “%s”', (actual, expected) => {
  const result = normalize(actual);
  expect(result).toBe(expected);
});

it('should have an option to not support a trailing hyphen', () => {
  const result = normalize('trailing-hyphen-', false);
  expect(result).toBe('trailing-hyphen-');
});
