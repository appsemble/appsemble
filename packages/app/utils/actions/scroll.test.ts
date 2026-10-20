import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createTestAction } from '../makeActions.js';

let prefersReducedMotion: boolean;

beforeEach(() => {
  prefersReducedMotion = false;
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query === '(prefers-reduced-motion: reduce)' && prefersReducedMotion,
  }));
  vi.spyOn(window, 'scrollTo').mockImplementation(() => null);
  vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(1234);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('scroll', () => {
  it('should scroll to the top of the page', async () => {
    const action = createTestAction({ definition: { type: 'scroll', to: 'top' } });
    const result = await action({ input: 'data' });
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    expect(result).toStrictEqual({ input: 'data' });
  });

  it('should scroll to the bottom of the page', async () => {
    const action = createTestAction({ definition: { type: 'scroll', to: 'bottom' } });
    const result = await action({ input: 'data' });
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 1234, behavior: 'smooth' });
    expect(result).toStrictEqual({ input: 'data' });
  });

  it('should jump instead of animate when the user prefers reduced motion', async () => {
    prefersReducedMotion = true;
    const action = createTestAction({ definition: { type: 'scroll', to: 'top' } });
    await action({ input: 'data' });
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
  });
});
