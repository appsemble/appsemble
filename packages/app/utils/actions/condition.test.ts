import { remap } from '@appsemble/utils';

import { createTestAction } from '../makeActions.js';

describe('condition', () => {
  it('call then if the condition is true', async () => {
    const ok = vi.fn().mockReturnValue('ok');
    const error = vi.fn().mockReturnValue('error');

    const action = createTestAction({
      definition: {
        type: 'condition',
        if: { prop: 'input' },
        then: { type: 'dialog.ok' },
        else: { type: 'dialog.error' },
      },
      extraCreators: {
        'dialog.ok': () => [ok],
        'dialog.error': () => [error],
      },
      remap,
    });
    const result = await action({ input: true }, { context: null });
    expect(ok).toHaveBeenCalledWith(
      { input: true },
      { context: null, history: [{ input: true }, { input: true }] },
    );
    expect(error).not.toHaveBeenCalled();
    expect(result).toBe('ok');
  });

  it('call else if the condition is false', async () => {
    const ok = vi.fn().mockReturnValue('ok');
    const error = vi.fn().mockReturnValue('error');

    const action = createTestAction({
      definition: {
        type: 'condition',
        if: { prop: 'input' },
        then: { type: 'dialog.ok' },
        else: { type: 'dialog.error' },
      },
      extraCreators: {
        'dialog.ok': () => [ok],
        'dialog.error': () => [error],
      },
      remap,
    });
    const result = await action({ input: false }, { context: null });
    expect(ok).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith(
      { input: false },
      { context: null, history: [{ input: false }, { input: false }] },
    );
    expect(result).toBe('error');
  });
});
