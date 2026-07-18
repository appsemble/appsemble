import { describe, expect, it } from 'vitest';

import {
  getBlockAssetContentHash,
  getBlockAssetStorageKey,
  isValidBlockAssetFilename,
} from './blockAssets.js';

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

describe('getBlockAssetContentHash', () => {
  it('should return the sha256 hex digest of the content', () => {
    // Anchored to the published NIST sha256 test vector for "abc" so a change to the hash
    // algorithm, encoding, or truncation is caught independently of the production code.
    expect(getBlockAssetContentHash(Buffer.from('abc'))).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('should produce different hashes for different content', () => {
    expect(getBlockAssetContentHash(Buffer.from('a'))).not.toBe(
      getBlockAssetContentHash(Buffer.from('b')),
    );
  });
});

describe('getBlockAssetStorageKey', () => {
  it('should build a content-addressed key from the location parts', () => {
    expect(
      getBlockAssetStorageKey({
        blockName: 'test',
        contentHash: 'ba7816bf',
        filename: 'build/standing.png',
        organizationId: 'xkcd',
        version: '1.2.3',
      }),
    ).toBe('xkcd/test/1.2.3/ba7816bf/build/standing.png');
  });
});
