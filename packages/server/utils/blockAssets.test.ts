import { describe, expect, it } from 'vitest';

import { isValidBlockAssetFilename } from './blockAssets.js';

describe('isValidBlockAssetFilename', () => {
  it.each(['form.js', 'build/standing.png', 'chunks/editor language.js', 'a.b.c.js.map'])(
    'should accept the legitimate filename %j',
    (filename) => {
      expect(isValidBlockAssetFilename(filename)).toBe(true);
    },
  );

  it.each([
    '',
    '..',
    '../secret.js',
    'a/../../b.js',
    'foo/..',
    '/etc/passwd',
    'a\\b.js',
    `bad${String.fromCharCode(0)}name.js`,
  ])('should reject the unsafe filename %j', (filename) => {
    expect(isValidBlockAssetFilename(filename)).toBe(false);
  });
});
