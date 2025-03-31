import { remap } from '@appsemble/utils';
import { describe, expect, it, vi } from 'vitest';

import { createTestAction } from '../makeActions.js';

describe('condition', () => {
  it('call case 1 if the condition is true', async () => {
    const ok = vi.fn().mockReturnValue('ok');
    const error = vi.fn().mockReturnValue('error');

    const action = createTestAction({
      definition: {
        type: 'match',
        match: [
          { case: { equals: [{ prop: 'input' }, 'ok'] }, action: { type: 'dialog.ok' } },
          { case: { equals: [{ prop: 'input' }, 'error'] }, action: { type: 'dialog.error' } },
        ],
      },
      extraCreators: {
        'dialog.ok': () => [ok],
        'dialog.error': () => [error],
      },
      // @ts-expect-error Messed up
      remap,
    });
    const result = await action({ input: 'ok' }, { context: null });
    expect(ok).toHaveBeenCalledWith(
      { input: 'ok' },
      { context: null, history: [{ input: 'ok' }, { input: 'ok' }] },
    );
    expect(error).not.toHaveBeenCalled();
    expect(result).toBe('ok');
  });

  it('call case 2 if the condition is false', async () => {
    const ok = vi.fn().mockReturnValue('ok');
    const error = vi.fn().mockReturnValue('error');

    const action = createTestAction({
      definition: {
        type: 'match',
        match: [
          { case: { equals: [{ prop: 'input' }, 'ok'] }, action: { type: 'dialog.ok' } },
          { case: { equals: [{ prop: 'input' }, 'error'] }, action: { type: 'dialog.error' } },
        ],
      },
      extraCreators: {
        'dialog.ok': () => [ok],
        'dialog.error': () => [error],
      },
      // @ts-expect-error Messed up
      remap,
    });
    const result = await action({ input: 'error' }, { context: null });
    expect(ok).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith(
      { input: 'error' },
      { context: null, history: [{ input: 'error' }, { input: 'error' }] },
    );
    expect(result).toBe('error');
  });

  it('no matches should call nothing', async () => {
    const ok = vi.fn().mockReturnValue('ok');
    const error = vi.fn().mockReturnValue('error');

    const action = createTestAction({
      definition: {
        type: 'match',
        match: [
          { case: { equals: [{ prop: 'input' }, 'ok'] }, action: { type: 'dialog.ok' } },
          { case: { equals: [{ prop: 'input' }, 'error'] }, action: { type: 'dialog.error' } },
        ],
      },
      extraCreators: {
        'dialog.ok': () => [ok],
        'dialog.error': () => [error],
      },
      // @ts-expect-error Messed up
      remap,
    });
    const result = await action({ input: 'no match' }, { context: null });
    expect(ok).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ input: 'no match' });
  });
});
