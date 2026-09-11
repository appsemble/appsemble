import { getDefaultBootstrapParams } from '@appsemble/block-interaction-tests';
import { type Action, type BootstrapParams } from '@appsemble/sdk';
import { render } from '@testing-library/preact';
import { expect, it, vi } from 'vitest';

import { FilterBlock } from './bootstrap.js';

type BlockProps = BootstrapParams & { ready: (value: PromiseLike<void> | void) => void };

const defaultBootstrapParams = getDefaultBootstrapParams();

interface Setup {
  emitted: unknown[];
  refresh: () => Promise<void>;
  resolvers: ((value: unknown) => void)[];
  rejecters: ((reason: unknown) => void)[];
}

function setup(): Setup {
  const result = {
    emitted: [] as unknown[],
    resolvers: [] as ((value: unknown) => void)[],
    rejecters: [] as ((reason: unknown) => void)[],
  } as Setup;

  const onLoad = Object.assign(
    <R,>(): Promise<R> =>
      new Promise<R>((resolve, reject) => {
        result.resolvers.push(resolve as (value: unknown) => void);
        result.rejecters.push(reject);
      }),
    { type: 'resource.query' as const },
  );

  const props: BlockProps = {
    ...defaultBootstrapParams,
    parameters: { fields: [] },
    actions: { onLoad: onLoad as unknown as Action },
    events: {
      emit: {
        filtered(data, error) {
          result.emitted.push(['filtered', data, error]);
          return Promise.resolve(true);
        },
        refreshed(data, error) {
          result.emitted.push(['refreshed', data, error]);
          return Promise.resolve(true);
        },
      },
      on: {
        refresh(callback) {
          result.refresh = callback as () => Promise<void>;
          return true;
        },
      },
      off: {
        refresh() {
          return true;
        },
      },
    },
    ready: vi.fn(),
  };

  render(<FilterBlock {...props} />);
  return result;
}

it('should emit loads that resolve in order', async () => {
  const { emitted, refresh, resolvers } = setup();
  // The initial load starts on render.
  resolvers[0]('initial');
  await Promise.resolve();
  const refreshed = refresh();
  resolvers[1]('refreshed');
  await refreshed;
  expect(emitted).toStrictEqual([
    ['filtered', 'initial', undefined],
    ['refreshed', 'refreshed', undefined],
  ]);
});

it('should drop a stale load when a newer load started meanwhile', async () => {
  const { emitted, refresh, resolvers } = setup();
  // The initial load starts on render and is still pending when a refresh starts.
  const refreshed = refresh();
  resolvers[1]('newest');
  await refreshed;
  resolvers[0]('stale');
  await Promise.resolve();
  expect(emitted).toStrictEqual([['refreshed', 'newest', undefined]]);
});

it('should not emit an error when the load is aborted by owner unmount', async () => {
  const { emitted, rejecters } = setup();
  // The initial load starts on render; the block is unmounted before it resolves.
  const abortError = new Error('Action owner was aborted');
  abortError.name = 'ActionOwnerAbortError';
  rejecters[0](abortError);
  await Promise.resolve();
  await Promise.resolve();
  expect(emitted).toStrictEqual([]);
});
