import { remap } from '@appsemble/lang-sdk';
import { describe, expect, it, vi } from 'vitest';

import { createTestAction } from '../makeActions.js';

describe('message', () => {
  it('should return the input data', async () => {
    const showMessage = vi.fn();
    const action = createTestAction({
      definition: { type: 'message', body: '' },
      // @ts-expect-error Messed up
      remap,
      showMessage,
    });
    const result = await action({ input: 'data' });
    expect(result).toStrictEqual({ input: 'data' });
  });

  it('should show the remapped message', async () => {
    const showMessage = vi.fn();
    const action = createTestAction({
      definition: { type: 'message', body: { 'string.case': 'upper' } },
      // @ts-expect-error Messed up
      remap,
      showMessage,
    });
    await action('Hello, world');
    expect(showMessage).toHaveBeenCalledWith({
      body: 'HELLO, WORLD',
      color: 'info',
      dismissable: undefined,
      timeout: undefined,
    });
  });

  it('should support customizations', async () => {
    const showMessage = vi.fn();
    const action = createTestAction({
      definition: {
        type: 'message',
        body: { 'string.case': 'upper' },
        color: 'danger',
        dismissable: true,
        timeout: 10,
      },
      // @ts-expect-error Messed up
      remap,
      showMessage,
    });
    await action('Hello, world');
    expect(showMessage).toHaveBeenCalledWith({
      body: 'HELLO, WORLD',
      color: 'danger',
      dismissable: true,
      timeout: 10,
    });
  });
});
