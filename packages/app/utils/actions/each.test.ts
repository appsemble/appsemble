import { remap } from '@appsemble/utils';
import { describe, expect, it, vi } from 'vitest';

import { createTestAction } from '../makeActions.js';

describe('each', () => {
  it('call do for each entry in an array', async () => {
    const ok = vi.fn().mockReturnValue('ok');

    const action = createTestAction({
      definition: {
        type: 'each',
        do: { type: 'dialog.ok' },
      },
      extraCreators: {
        'dialog.ok': () => [ok],
      },
      // @ts-expect-error Messed up
      remap,
    });
    const result = await action([1, 2], { context: null });
    expect(ok).toHaveBeenCalledWith(1, { context: null, history: [[1, 2], 1] });
    expect(ok).toHaveBeenCalledWith(2, { context: null, history: [[1, 2], 2] });
    expect(ok).toHaveBeenCalledTimes(2);
    expect(result).toStrictEqual(['ok', 'ok']);
  });

  it('call treat non-array input as a single item array.', async () => {
    const ok = vi.fn().mockReturnValue('ok');

    const action = createTestAction({
      definition: {
        type: 'each',
        do: { type: 'dialog.ok' },
      },
      extraCreators: {
        'dialog.ok': () => [ok],
      },
      // @ts-expect-error Messed up
      remap,
    });
    const result = await action(1, { context: null });
    expect(ok).toHaveBeenCalledWith(1, { context: null, history: [1, 1] });
    expect(ok).toHaveBeenCalledTimes(1);
    expect(result).toStrictEqual(['ok']);
  });
});
