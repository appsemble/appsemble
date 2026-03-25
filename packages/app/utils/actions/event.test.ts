import { EventEmitter } from 'events';

import { ActionError } from '@appsemble/lang-sdk';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createTestAction } from '../makeActions.js';

describe('event', () => {
  let ee: EventEmitter;

  beforeEach(() => {
    // eslint-disable-next-line unicorn/prefer-event-target
    ee = new EventEmitter();
    vi.spyOn(ee, 'once');
  });

  afterEach(() => {
    ee.removeAllListeners();
  });

  it('should return the input data', async () => {
    const action = createTestAction({
      ee,
      definition: { type: 'event', event: 'foo' },
    });
    const result = await action({ test: 'data' });
    expect(result).toStrictEqual({ test: 'data' });
    expect(ee.once).not.toHaveBeenCalled();
  });

  it('should wait for a response event if waitFor is defined', async () => {
    const action = createTestAction({
      ee,
      definition: { type: 'event', event: 'foo', waitFor: 'bar' },
    });
    const result = action();
    // Wait 1 tick before emitting.
    await Promise.resolve();
    ee.emit('bar', { test: 'data' });
    expect(await result).toStrictEqual({ test: 'data' });
    expect(ee.once).toHaveBeenCalledTimes(1);
  });

  it('should reject of a response event emits an error', async () => {
    const action = createTestAction({
      ee,
      definition: { type: 'event', event: 'foo', waitFor: 'bar' },
    });
    const result = action();
    // Wait 1 tick before emitting.
    await Promise.resolve();
    ee.emit('bar', { test: 'data' }, 'Boo!');
    await expect(result).rejects.toThrow(
      new ActionError({
        cause: 'Boo!',
        data: null,
        definition: { type: 'event', event: 'foo', waitFor: 'bar' },
      }),
    );
    expect(ee.once).toHaveBeenCalledTimes(1);
  });
});
