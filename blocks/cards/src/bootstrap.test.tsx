import { Context } from '@appsemble/preact';
import { type BootstrapParams } from '@appsemble/sdk';
import { act, render, screen } from '@testing-library/preact';
import { expect, it, vi } from 'vitest';

import { Cards } from './bootstrap.js';

type BlockProps = BootstrapParams & { ready: (value: PromiseLike<void> | void) => void };

interface Item {
  id: number;
  title: string;
}

interface SetupOptions {
  /**
   * Whether to hide the block when it has no data.
   */
  hideOnNoData?: boolean;
}

interface Setup {
  /**
   * Delivers a `data` event to the block.
   */
  emitData: (data: Item[], error?: string) => Promise<void>;

  /**
   * Delivers a `reset` event to the block.
   */
  emitReset: () => Promise<void>;

  /**
   * Records the calls to `events.off.data`.
   */
  offData: ReturnType<typeof vi.fn>;

  /**
   * Records the calls to `events.off.reset`.
   */
  offReset: ReturnType<typeof vi.fn>;

  /**
   * Records the calls to `ready`.
   */
  ready: ReturnType<typeof vi.fn>;

  /**
   * Unmounts the block.
   */
  unmount: () => void;
}

function setup({ hideOnNoData = false }: SetupOptions = {}): Setup {
  const offData = vi.fn();
  const offReset = vi.fn();
  const ready = vi.fn();
  let dataCallback: (data: Item[], error?: string) => void;
  let resetCallback: () => void;

  const props = {
    actions: {
      onClick: Object.assign(() => Promise.resolve(), { type: 'noop' as const }),
    },
    data: undefined,
    events: {
      emit: {},
      on: {
        data(callback: unknown) {
          dataCallback = callback as typeof dataCallback;
          return true;
        },
        reset(callback: unknown) {
          resetCallback = callback as typeof resetCallback;
          return true;
        },
      },
      off: { data: offData, reset: offReset },
    } as unknown as BlockProps['events'],
    parameters: {
      card: { content: { prop: 'title' } },
      defaultImage: '',
      hideOnNoData,
    },
    ready,
    utils: {
      asset: (value: string) => value,
      formatMessage: (id: string) => id,
      remap(remapper: string | { prop: string } | undefined, data: Item) {
        return typeof remapper === 'object' ? data[remapper.prop as keyof Item] : remapper;
      },
    },
  } as unknown as BlockProps;

  const { unmount } = render(
    <Context.Provider value={props}>
      <Cards {...props} />
    </Context.Provider>,
  );

  return {
    async emitData(data, error) {
      await act(() => {
        dataCallback(data, error);
      });
    },
    async emitReset() {
      await act(() => {
        resetCallback();
      });
    },
    offData,
    offReset,
    ready,
    unmount,
  };
}

it('should show a loader and signal readiness until data arrives', () => {
  const { ready } = setup();

  expect(screen.getByTestId('loader-comp')).toBeDefined();
  expect(screen.queryByText('noData')).toBeNull();
  expect(ready).toHaveBeenCalledWith();
});

it('should show the error message when the data event reports an error', async () => {
  const { emitData } = setup();

  await emitData([], 'Something broke');

  expect(screen.getByText('error')).toBeDefined();
});

it('should recover from an error when later data arrives', async () => {
  const { emitData } = setup();

  await emitData([], 'Something broke');
  await emitData([{ id: 1, title: 'Recovered' }]);

  expect(screen.queryByText('error')).toBeNull();
  expect(screen.getByText('Recovered')).toBeDefined();
});

it('should show the empty message when there is nothing to display', async () => {
  const { emitData } = setup();

  await emitData([]);

  expect(screen.getByText('noData')).toBeDefined();
});

it('should hide when configured to hide without data', async () => {
  const { emitData } = setup({ hideOnNoData: true });

  await emitData([]);

  expect(screen.queryByText('noData')).toBeNull();
});

it('should render the received cards', async () => {
  const { emitData } = setup();

  await emitData([
    { id: 1, title: 'First' },
    { id: 2, title: 'Second' },
  ]);

  expect(screen.getByText('First')).toBeDefined();
  expect(screen.getByText('Second')).toBeDefined();
});

it('should clear the cards when reset', async () => {
  const { emitData, emitReset } = setup();

  await emitData([{ id: 1, title: 'Visible' }]);
  await emitReset();

  expect(screen.queryByText('Visible')).toBeNull();
  expect(screen.getByText('noData')).toBeDefined();
});

it('should stop listening for data and reset when unmounted', () => {
  const { offData, offReset, unmount } = setup();

  unmount();

  expect(offData).toHaveBeenCalledOnce();
  expect(offReset).toHaveBeenCalledOnce();
});
