import { describe, expect, it } from 'vitest';

import { injectCSS } from './injectCSS.js';

describe('stylesheet loading', () => {
  it('should finish when the stylesheet loads', async () => {
    const root = document.createDocumentFragment();
    const loading = injectCSS(root, '/block.css');
    root.querySelector('link')!.dispatchEvent(new Event('load'));
    expect(await loading).toBeUndefined();
  });

  it('should report a failed stylesheet rather than leave loading pending', async () => {
    const root = document.createDocumentFragment();
    const loading = injectCSS(root, '/missing.css');
    root.querySelector('link')!.dispatchEvent(new Event('error'));
    await expect(loading).rejects.toThrow('Failed to load stylesheet: /missing.css');
  });

  it('should finish when no stylesheet is configured', async () => {
    expect(await injectCSS(document.createDocumentFragment())).toBeUndefined();
  });
});
