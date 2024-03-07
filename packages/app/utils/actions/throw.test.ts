import { ActionError } from '@appsemble/types';
import { describe, expect, it } from 'vitest';

import { createTestAction } from '../makeActions.js';

describe('throw', () => {
  it('should return the static value', async () => {
    const action = createTestAction({ definition: { type: 'throw' } });
    const result = action('Input data');
    await expect(result).rejects.toThrow(
      new ActionError({ cause: 'Input data', data: null, definition: { type: 'throw' } }),
    );
  });
});
