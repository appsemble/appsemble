import { describe, expect, it } from 'vitest';

import { checkRole } from './checkRole.js';

describe('checkRole', () => {
  it('should return a promise that resolves to an empty object', async () => {
    const result = await checkRole();
    expect(result).toStrictEqual({});
  });

  it('should return a promise', () => {
    const result = checkRole();
    expect(result instanceof Promise).toBe(true);
  });
});
