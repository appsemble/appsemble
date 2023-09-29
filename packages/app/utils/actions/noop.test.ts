import { describe, expect, it } from 'vitest';

import { createTestAction } from '../makeActions.js';

describe('noop', () => {
  it('should return the input data', async () => {
    const action = createTestAction({ definition: { type: 'noop' } });
    const result = await action({ test: 'data' });
    expect(result).toStrictEqual({ test: 'data' });
  });
});
