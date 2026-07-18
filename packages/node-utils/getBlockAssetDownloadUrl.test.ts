import { describe, expect, it } from 'vitest';

import { getBlockAssetDownloadUrl, isValidBlockAssetFilename } from './getBlockAssetDownloadUrl.js';

describe('isValidBlockAssetFilename', () => {
  it.each(['form.js', 'build/standing.png', 'chunks/editor language.js', 'a.b.c.js.map'])(
    'should accept the legitimate filename %j',
    (filename) => {
      expect(isValidBlockAssetFilename(filename)).toBe(true);
    },
  );

  it.each([
    '',
    '.',
    '..',
    './form.js',
    '../secret.js',
    'a/./b.js',
    'a/../../b.js',
    'foo/..',
    '/etc/passwd',
    'a\\b.js',
    `bad${String.fromCharCode(0)}name.js`,
  ])('should reject the unsafe filename %j', (filename) => {
    expect(isValidBlockAssetFilename(filename)).toBe(false);
  });
});

describe('getBlockAssetDownloadUrl', () => {
  it('should use the public file URL when available', () => {
    const fileUrl = 'https://objects.example/block-assets/appsemble/form/1.2.3/hash/form.js';

    expect(
      getBlockAssetDownloadUrl(
        'https://appsemble.example/api/blocks/@appsemble/form/versions/1.2.3',
        { 'form.js': fileUrl },
        'form.js',
      ),
    ).toBe(fileUrl);
  });

  it('should fall back to the block asset endpoint', () => {
    expect(
      getBlockAssetDownloadUrl(
        'https://appsemble.example/api/blocks/@appsemble/form/versions/1.2.3',
        undefined,
        'chunks/editor language.js',
      ),
    ).toBe(
      'https://appsemble.example/api/blocks/@appsemble/form/versions/1.2.3/asset?filename=chunks%2Feditor+language.js',
    );
  });

  it('should ignore inherited file URL properties', () => {
    expect(
      getBlockAssetDownloadUrl(
        'https://appsemble.example/api/blocks/@appsemble/form/versions/1.2.3',
        {},
        'toString',
      ),
    ).toBe(
      'https://appsemble.example/api/blocks/@appsemble/form/versions/1.2.3/asset?filename=toString',
    );
  });
});
