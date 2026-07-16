import { type BootstrapParams } from '@appsemble/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DataLoader } from './bootstrap.js';

describe('DataLoader', () => {
  let params: BootstrapParams;
  let refresh: (data?: Record<string, unknown>) => void;
  let resolvers: ((value: unknown) => void)[];
  let rejecters: ((reason: unknown) => void)[];
  let emit: ReturnType<typeof vi.fn>;
  let showMessage: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    resolvers = [];
    rejecters = [];
    emit = vi.fn();
    showMessage = vi.fn();
    params = {
      actions: {
        onLoad: vi.fn(
          () =>
            new Promise((resolve, reject) => {
              resolvers.push(resolve);
              rejecters.push(reject);
            }),
        ),
      },
      data: undefined,
      events: {
        emit: { data: emit },
        on: {
          refresh(callback: typeof refresh) {
            refresh = callback;
            return true;
          },
        },
      },
      pageParameters: {},
      parameters: {},
      utils: {
        formatMessage: vi.fn().mockReturnValue('Failed to load data'),
        showMessage,
      },
    } as unknown as BootstrapParams;
  });

  it('should emit results that arrive in order', async () => {
    DataLoader(params);
    resolvers[0]('first');
    await Promise.resolve();
    refresh();
    resolvers[1]('second');
    await Promise.resolve();
    expect(emit).toHaveBeenNthCalledWith(1, 'first');
    expect(emit).toHaveBeenNthCalledWith(2, 'second');
  });

  it('should drop a result when a newer load started meanwhile', async () => {
    DataLoader(params);
    refresh();
    resolvers[1]('newest');
    await Promise.resolve();
    resolvers[0]('stale');
    await Promise.resolve();
    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith('newest');
  });

  it('should ignore a failure of a superseded load', async () => {
    DataLoader(params);
    refresh();
    resolvers[1]('newest');
    await Promise.resolve();
    rejecters[0](new Error('stale failure'));
    await Promise.resolve();
    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith('newest');
    expect(showMessage).not.toHaveBeenCalled();
  });
});
