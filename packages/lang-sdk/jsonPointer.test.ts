// From https://gitlab.com/remcohaszing/koas/-/blob/main/packages/koas-core/src/jsonRefs.test.ts

import { describe, expect, it } from 'vitest';

import { escapeJsonPointer, unescapeJsonPointer } from './jsonPointer.js';

const tests = [
  ['foo/bar', 'foo~1bar'],
  ['foo~bar', 'foo~0bar'],
  ['foo~/bar', 'foo~0~1bar'],
  ['foo/~bar', 'foo~1~0bar'],
];

describe('escapeJsonPointer', () => {
  it.each(tests)('%s → %s', (unescaped, escaped) => {
    const result = escapeJsonPointer(unescaped);
    expect(result).toBe(escaped);
  });
});

describe('unescapeJsonPointer', () => {
  it.each(tests)('%s ← %s', (unescaped, escaped) => {
    const result = unescapeJsonPointer(escaped);
    expect(result).toBe(unescaped);
  });
});
