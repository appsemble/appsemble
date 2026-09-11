import { describe, expect, it } from 'vitest';

import { replaceAssetFunctions } from './assetCssURL.js';

describe('replaceAssetFunctions', () => {
  it('should resolve asset utility URLs using the given host', () => {
    const result = replaceAssetFunctions(
      "a{background:url(asset('hero-bg'))}",
      42,
      'http://localhost',
    );

    expect(result).toBe("a{background:url('http://localhost/api/apps/42/assets/hero-bg')}");
  });

  it('should resolve standalone asset utility functions', () => {
    const result = replaceAssetFunctions("a{background:asset('hero-bg')}", 42, 'http://localhost');

    expect(result).toBe("a{background:url('http://localhost/api/apps/42/assets/hero-bg')}");
  });

  it('should resolve asset utility URLs against a host with a port', () => {
    const result = replaceAssetFunctions(
      "a{background:url(asset('hero-bg'))}",
      1,
      'http://localhost:9191',
    );

    expect(result).toBe("a{background:url('http://localhost:9191/api/apps/1/assets/hero-bg')}");
  });

  it('should not rewrite app asset paths that contain ..', () => {
    const result = replaceAssetFunctions(
      "a{background:url(asset('/api/apps/1/assets/../admin'))}",
      42,
      'http://localhost',
    );

    expect(result).toBe("a{background:url(asset('/api/apps/1/assets/../admin'))}");
  });

  it('should not rewrite app asset paths that contain encoded slashes', () => {
    const result = replaceAssetFunctions(
      "a{background:url(asset('/api/apps/1/assets/a%2fb'))}",
      42,
      'http://localhost',
    );

    expect(result).toBe("a{background:url(asset('/api/apps/1/assets/a%2fb'))}");
  });

  it('should not create app asset URLs for asset ids with encoded slashes', () => {
    const result = replaceAssetFunctions(
      "a{background:url(asset('a%2fb'))}",
      42,
      'http://localhost',
    );

    expect(result).toBe("a{background:url(asset('a%2fb'))}");
  });

  it('should not rewrite app asset URLs if they contain encoded slashes', () => {
    const result = replaceAssetFunctions(
      "a{background:url('/api/apps/1/assets/a%2fb')}",
      42,
      'http://localhost',
    );

    expect(result).toBe("a{background:url('/api/apps/1/assets/a%2fb')}");
  });
});
