import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createTestAction } from '../makeActions.js';

beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => null);
  vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(1234);
});

afterEach(() => {
  vi.restoreAllMocks();
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
});
