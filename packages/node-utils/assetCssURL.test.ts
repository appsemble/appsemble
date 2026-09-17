import { describe, expect, it } from 'vitest';

import { replaceAssetFunctions } from './assetCssURL.js';

describe('replaceAssetFunctions', () => {
  it('should resolve asset utility URLs using the given host', () => {
    const result = replaceAssetFunctions("a{background:asset('hero-bg')}", 42, 'http://localhost');

    expect(result).toBe("a{background:url('http://localhost/api/apps/42/assets/hero-bg')}");
  });

  it('should resolve asset utility URLs surrounded by whitespace', () => {
    const result = replaceAssetFunctions(
      "a{background:asset( 'hero-bg' )}",
      42,
      'http://localhost',
    );

    expect(result).toBe("a{background:url('http://localhost/api/apps/42/assets/hero-bg')}");
  });

  it('should resolve asset utility URLs written with double quotes', () => {
    const result = replaceAssetFunctions('a{background:asset("hero-bg")}', 42, 'http://localhost');

    expect(result).toBe("a{background:url('http://localhost/api/apps/42/assets/hero-bg')}");
  });

  it('should resolve asset utility URLs against a host with a port', () => {
    const result = replaceAssetFunctions(
      "a{background:asset('hero-bg')}",
      1,
      'http://localhost:9191',
    );

    expect(result).toBe("a{background:url('http://localhost:9191/api/apps/1/assets/hero-bg')}");
  });

  it('should resolve asset utility app asset paths to the given app and host', () => {
    const result = replaceAssetFunctions(
      "a{background:asset('/api/apps/999/assets/logo?width=10#mark')}",
      42,
      'http://localhost',
    );

    expect(result).toBe(
      "a{background:url('http://localhost/api/apps/42/assets/logo?width=10#mark')}",
    );
  });

  it('should throw if an asset utility contains an invalid asset reference', () => {
    expect(() =>
      replaceAssetFunctions("a{background:asset('invalid_asset')}", 42, 'http://localhost'),
    ).toThrow('Invalid asset reference: invalid_asset');
  });

  it('should throw if an asset utility contains path traversal', () => {
    expect(() =>
      replaceAssetFunctions("a{background:asset('../admin')}", 42, 'http://localhost'),
    ).toThrow('Invalid asset reference: ../admin');
  });

  it('should throw if an asset utility contains encoded path separators', () => {
    expect(() =>
      replaceAssetFunctions("a{background:asset('a%2fb')}", 42, 'http://localhost'),
    ).toThrow('Invalid asset reference: a%2fb');
  });

  it('should resolve asset utility URLs in custom properties', () => {
    const result = replaceAssetFunctions(
      "a{--hero:asset('hero-bg');background:var(--hero)}",
      42,
      'http://localhost',
    );

    expect(result).toBe(
      "a{--hero:url('http://localhost/api/apps/42/assets/hero-bg');background:var(--hero)}",
    );
  });

  it('should rewrite app asset URLs in custom properties', () => {
    const result = replaceAssetFunctions(
      "a{--hero: url('/api/apps/999/assets/logo')}",
      42,
      'http://localhost',
    );

    expect(result).toBe("a{--hero: url('http://localhost/api/apps/42/assets/logo')}");
  });

  it('should throw if a custom property contains an invalid asset reference', () => {
    expect(() =>
      replaceAssetFunctions("a{--hero:asset('../admin')}", 42, 'http://localhost'),
    ).toThrow('Invalid asset reference: ../admin');
  });

  it('should leave custom properties without asset references unchanged', () => {
    const result = replaceAssetFunctions(
      'a{--hero:red;--gap:calc(1px + 2px)}',
      42,
      'http://localhost',
    );

    expect(result).toBe('a{--hero:red;--gap:calc(1px + 2px)}');
  });

  it('should throw if an asset utility is not called with a string', () => {
    expect(() =>
      replaceAssetFunctions('a{background:asset(hero-bg)}', 42, 'http://localhost'),
    ).toThrow('The asset utility takes a single string');
  });

  it('should throw if an asset utility is called with multiple arguments', () => {
    expect(() =>
      replaceAssetFunctions("a{background:asset('a', 'b')}", 42, 'http://localhost'),
    ).toThrow('The asset utility takes a single string');
  });

  it('should leave asset utilities nested in url() unchanged', () => {
    const result = replaceAssetFunctions(
      "a{background:url(asset('hero-bg'))}b{background:url('/api/apps/1/assets/logo')}",
      42,
      'http://localhost',
    );

    expect(result).toBe(
      "a{background:url(asset('hero-bg'))}" +
        "b{background:url('http://localhost/api/apps/42/assets/logo')}",
    );
  });

  it('should escape quotes in the fragment of an asset utility app asset path', () => {
    const result = replaceAssetFunctions(
      `a{background:asset("/api/apps/1/assets/logo#');}body{color:red}/*")}`,
      42,
      'http://localhost',
    );

    expect(result).toBe(
      `a{background:url('http://localhost/api/apps/42/assets/logo#%27);}body{color:red}/*')}`,
    );
  });

  it('should escape backslashes in the fragment of an asset utility app asset path', () => {
    const result = replaceAssetFunctions(
      `a{background:asset("/api/apps/1/assets/logo#a\\\\b")}`,
      42,
      'http://localhost',
    );

    expect(result).toBe("a{background:url('http://localhost/api/apps/42/assets/logo#a%5Cb')}");
  });

  it('should escape quotes in the fragment of an app asset URL', () => {
    const result = replaceAssetFunctions(
      `a{background:url("/api/apps/1/assets/logo#');}body{color:red}/*")}`,
      42,
      'http://localhost',
    );

    expect(result).toBe(
      `a{background:url('http://localhost/api/apps/42/assets/logo#%27);}body{color:red}/*')}`,
    );
  });

  it('should rewrite app asset URLs to the given app and host', () => {
    const result = replaceAssetFunctions(
      "a{background:url('/api/apps/999/assets/logo?width=10#mark')}",
      42,
      'http://localhost',
    );

    expect(result).toBe(
      "a{background:url('http://localhost/api/apps/42/assets/logo?width=10#mark')}",
    );
  });

  it('should rewrite absolute app asset URLs on the same host', () => {
    const result = replaceAssetFunctions(
      "a{background:url('http://localhost/api/apps/999/assets/logo?width=10#mark')}",
      42,
      'http://localhost',
    );

    expect(result).toBe(
      "a{background:url('http://localhost/api/apps/42/assets/logo?width=10#mark')}",
    );
  });

  it('should not rewrite app asset URLs on the same host with another port', () => {
    const result = replaceAssetFunctions(
      "a{background:url('http://localhost:9191/api/apps/999/assets/logo')}",
      42,
      'http://localhost',
    );

    expect(result).toBe("a{background:url('http://localhost:9191/api/apps/999/assets/logo')}");
  });

  it('should not rewrite protocol relative app asset URLs', () => {
    const result = replaceAssetFunctions(
      "a{background:url('//localhost/api/apps/999/assets/logo')}",
      42,
      'http://localhost',
    );

    expect(result).toBe("a{background:url('//localhost/api/apps/999/assets/logo')}");
  });

  it('should not rewrite absolute app asset URLs from another host', () => {
    const result = replaceAssetFunctions(
      "a{background:url('https://example.com/api/apps/999/assets/logo?width=10#mark')}",
      42,
      'http://localhost',
    );

    expect(result).toBe(
      "a{background:url('https://example.com/api/apps/999/assets/logo?width=10#mark')}",
    );
  });

  it('should leave invalid app asset URLs unchanged', () => {
    const result = replaceAssetFunctions(
      "a{background:url('/api/apps/1/assets/../admin')}",
      42,
      'http://localhost',
    );

    expect(result).toBe("a{background:url('/api/apps/1/assets/../admin')}");
  });

  it('should leave ordinary URLs with encoded slashes unchanged', () => {
    const result = replaceAssetFunctions(
      "a{background:url('/api/apps/1/assets/a%2fb')}",
      42,
      'http://localhost',
    );

    expect(result).toBe("a{background:url('/api/apps/1/assets/a%2fb')}");
  });
});
