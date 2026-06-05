import { describe, expect, it } from 'vitest';

import { getBlockAssetDownloadUrl } from './getBlockAssetDownloadUrl.js';

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
});
