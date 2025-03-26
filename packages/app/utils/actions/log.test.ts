import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createTestAction } from '../makeActions.js';

describe('log', () => {
  beforeEach(() => {
    // @ts-expect-error 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    vi.spyOn(console, 'error').mockImplementation(null);
    // @ts-expect-error 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    vi.spyOn(console, 'info').mockImplementation(null);
    // @ts-expect-error 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    vi.spyOn(console, 'warn').mockImplementation(null);
  });

  it('should support the info logging level', async () => {
    const action = createTestAction({ definition: { type: 'log', level: 'info' } });
    const result = await action({ test: 'data' });
    expect(result).toStrictEqual({ test: 'data' });
    // eslint-disable-next-line no-console
    expect(console.info).toHaveBeenCalledWith({ test: 'data' });
  });

  it('should support the warn logging level', async () => {
    const action = createTestAction({ definition: { type: 'log', level: 'warn' } });
    const result = await action({ test: 'data' });
    expect(result).toStrictEqual({ test: 'data' });
    // eslint-disable-next-line no-console
    expect(console.warn).toHaveBeenCalledWith({ test: 'data' });
  });

  it('should support the error logging level', async () => {
    const action = createTestAction({ definition: { type: 'log', level: 'error' } });
    const result = await action({ test: 'data' });
    expect(result).toStrictEqual({ test: 'data' });
    // eslint-disable-next-line no-console
    expect(console.error).toHaveBeenCalledWith({ test: 'data' });
  });

  it('should default to the info logging level', async () => {
    const action = createTestAction({ definition: { type: 'log' } });
    const result = await action({ test: 'data' });
    expect(result).toStrictEqual({ test: 'data' });
    // eslint-disable-next-line no-console
    expect(console.info).toHaveBeenCalledWith({ test: 'data' });
  });
});
