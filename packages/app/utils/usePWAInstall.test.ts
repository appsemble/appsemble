import { act, renderHook } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';

import { usePWAInstall } from './usePWAInstall.js';

describe('usePWAInstall', () => {
  it('should offer installation until the install prompt is answered', async () => {
    const { result } = renderHook(() => usePWAInstall());

    expect(result.current).toBeNull();

    const prompt = vi.fn();
    act(() => {
      window.dispatchEvent(
        Object.assign(new Event('beforeinstallprompt'), {
          prompt,
          userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
        }),
      );
    });

    expect(result.current).toBeInstanceOf(Function);

    let accepted: boolean | undefined;
    await act(async () => {
      accepted = await result.current!();
    });

    expect(prompt).toHaveBeenCalledExactlyOnceWith();
    expect(accepted).toBe(true);
    expect(result.current).toBeNull();
  });
});
