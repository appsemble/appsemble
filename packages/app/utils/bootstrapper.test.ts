import { type BlockManifest } from '@appsemble/types';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { callBootstrap } from './bootstrapper.js';

function registerBootstrapOnAppend(bootstrapFn: () => unknown): ReturnType<typeof vi.spyOn> {
  return vi.spyOn(document.head, 'append').mockImplementation((...nodes: (string | Node)[]) => {
    const [firstNode] = nodes;

    if (!(firstNode instanceof HTMLScriptElement)) {
      return;
    }

    queueMicrotask(() => {
      Object.defineProperty(document, 'currentScript', {
        configurable: true,
        value: firstNode,
      });

      firstNode.dispatchEvent(
        new CustomEvent('AppsembleBootstrap', {
          detail: {
            document,
            fn: bootstrapFn,
          },
        }),
      );
    });
  });
}

describe('callBootstrap', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should load only the block entry file when present', async () => {
    const bootstrapFn = vi.fn();
    const appendSpy = registerBootstrapOnAppend(bootstrapFn);

    const manifest = {
      name: '@appsemble/form',
      version: '0.36.4',
      files: ['form.css', 'form.js', '3317.form.js', '5586.form.js'],
    } as unknown as BlockManifest;

    await callBootstrap(manifest, {
      shadowRoot: document.createElement('div').attachShadow({ mode: 'open' }),
    } as any);

    expect(appendSpy).toHaveBeenCalledTimes(1);
    const script = appendSpy.mock.calls[0][0] as HTMLScriptElement;
    expect(script.src).toContain('/api/blocks/@appsemble/form/versions/0.36.4/form.js');
    expect(bootstrapFn).toHaveBeenCalledTimes(1);
  });

  it('should fall back to first JavaScript file when normalized entry is missing', async () => {
    const bootstrapFn = vi.fn();
    const appendSpy = registerBootstrapOnAppend(bootstrapFn);

    const manifest = {
      name: '@acme/custom',
      version: '1.0.1',
      files: ['custom.css', 'vendors.form.js', 'another.form.js'],
    } as unknown as BlockManifest;

    await callBootstrap(manifest, {
      shadowRoot: document.createElement('div').attachShadow({ mode: 'open' }),
    } as any);

    expect(appendSpy).toHaveBeenCalledTimes(1);
    const script = appendSpy.mock.calls[0][0] as HTMLScriptElement;
    expect(script.src).toContain('/api/blocks/@acme/custom/versions/1.0.1/vendors.form.js');
    expect(bootstrapFn).toHaveBeenCalledTimes(1);
  });
});
