import { describe, expect, it } from 'vitest';

import { replaceAssetFunctions } from './assetCssURL.js';
import { setArgv } from './argv.js';

describe('replaceAssetFunctions', () => {
  it('should resolve asset utility URLs using argv host', () => {
    setArgv({ host: 'http://localhost' });

    const result = replaceAssetFunctions("a{background:url(asset('hero-bg'))}", 42);

    expect(result).toBe("a{background:url('http://localhost/api/apps/42/assets/hero-bg')}");
  });

  it('should not rewrite app asset paths that contain ..', () => {
    setArgv({ host: 'http://localhost' });

    const result = replaceAssetFunctions(
      "a{background:url(asset('/api/apps/1/assets/../admin'))}",
      42,
    );

    expect(result).toBe("a{background:url(asset('/api/apps/1/assets/../admin'))}");
  });

  it('should not rewrite app asset paths that contain encoded slashes', () => {
    setArgv({ host: 'http://localhost' });

    const result = replaceAssetFunctions(
      "a{background:url(asset('/api/apps/1/assets/a%2fb'))}",
      42,
    );

    expect(result).toBe("a{background:url(asset('/api/apps/1/assets/a%2fb'))}");
  });

  it('should not create app asset URLs for asset ids with encoded slashes', () => {
    setArgv({ host: 'http://localhost' });

    const result = replaceAssetFunctions("a{background:url(asset('a%2fb'))}", 42);

    expect(result).toBe("a{background:url(asset('a%2fb'))}");
  });

  it('should not rewrite app asset URLs if they contain encoded slashes', () => {
    setArgv({ host: 'http://localhost' });

    const result = replaceAssetFunctions("a{background:url('/api/apps/1/assets/a%2fb')}", 42);

    expect(result).toBe("a{background:url('/api/apps/1/assets/a%2fb')}");
  });
});
