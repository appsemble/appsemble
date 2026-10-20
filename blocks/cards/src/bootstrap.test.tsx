import { Context } from '@appsemble/preact';
import { type BootstrapParams } from '@appsemble/sdk';
import { act, render, screen } from '@testing-library/preact';
import { userEvent } from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';

import { Cards } from './bootstrap.js';

type BlockProps = BootstrapParams & { ready: (value: PromiseLike<void> | void) => void };

interface Item {
  id: number;
  title: string;
}

interface SetupOptions {
  /**
   * The card parameters.
   */
  card?: BlockProps['parameters']['card'];

  /**
   * Whether to hide the block when it has no data.
   */
  hideOnNoData?: boolean;

  /**
   * Whether the app renders on a mobile screen.
   */
  isMobile?: boolean;

  /**
   * The action triggered when a card is clicked.
   */
  onClick?: BlockProps['actions']['onClick'];
}

interface Setup {
  /**
   * The callback registered for `data` events.
   */
  dataCallback: (data: Item[], error?: string) => void;

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
   * The callback registered for `reset` events.
   */
  resetCallback: () => void;

  /**
   * Records the calls to `ready`.
   */
  ready: ReturnType<typeof vi.fn>;

  /**
   * Unmounts the block.
   */
  unmount: () => void;
}

function setup({
  card = { content: 'Content', title: { prop: 'title' } },
  hideOnNoData = false,
  isMobile = false,
  onClick = Object.assign(() => Promise.resolve(), {
    type: 'noop',
  }) as BlockProps['actions']['onClick'],
}: SetupOptions = {}): Setup {
  const offData = vi.fn();
  const offReset = vi.fn();
  const ready = vi.fn();
  let dataCallback: ((data: Item[], error?: string) => void) | undefined;
  let resetCallback: (() => void) | undefined;

  const props = {
    actions: { onClick },
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
      card,
      defaultImage: '',
      hideOnNoData,
    },
    ready,
    utils: {
      asset: (value: string) => value,
      fa: (name: string) => `fas fa-${name}`,
      formatMessage: (id: string) => id,
      isMobile,
      remap(remapper: string | { prop: string } | undefined, data: Item) {
        return typeof remapper === 'object' ? data[remapper.prop as keyof Item] : remapper;
      },
      resolveIcon: (name: string) => ({ type: 'fontawesome', name }),
    },
  } as unknown as BlockProps;

  const { unmount } = render(
    <Context.Provider value={props}>
      <Cards {...props} />
    </Context.Provider>,
  );

  if (!dataCallback || !resetCallback) {
    throw new Error('Cards did not register its event listeners');
  }
  const registeredDataCallback = dataCallback;
  const registeredResetCallback = resetCallback;

  return {
    dataCallback: registeredDataCallback,
    async emitData(data, error) {
      await act(() => {
        registeredDataCallback(data, error);
      });
    },
    async emitReset() {
      await act(() => {
        registeredResetCallback();
      });
    },
    offData,
    offReset,
    ready,
    resetCallback: registeredResetCallback,
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

  expect(screen.getByRole('alert').textContent).toBe('error');
});

it('should recover from an error when later data arrives', async () => {
  const { emitData } = setup();

  await emitData([], 'Something broke');
  await emitData([{ id: 1, title: 'Recovered' }]);

  expect(screen.queryByText('error')).toBeNull();
  expect(screen.getByText('Recovered')).toBeDefined();
});

it('should announce the empty message in a live region that exists before the data', async () => {
  const { emitData } = setup();
  const statuses = screen.getAllByRole('status');

  await emitData([]);

  expect(statuses.map((status) => status.textContent)).toContain('noData');
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
  const { dataCallback, offData, offReset, resetCallback, unmount } = setup();

  unmount();

  expect(offData).toHaveBeenCalledExactlyOnceWith(dataCallback);
  expect(offReset).toHaveBeenCalledExactlyOnceWith(resetCallback);
});

it('should open a card with a button that is reachable by keyboard', async () => {
  const onClick = Object.assign(vi.fn(), {
    type: 'click',
  }) as unknown as BlockProps['actions']['onClick'];
  const { emitData } = setup({ onClick });
  const item = { id: 1, title: 'First' };

  await emitData([item]);
  await userEvent.tab();
  await userEvent.keyboard('{Enter}');

  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'First' }));
  expect(onClick).toHaveBeenCalledExactlyOnceWith(item);
});

it('should name the button of a card without text by its image alt', async () => {
  const onClick = Object.assign(vi.fn(), {
    type: 'click',
  }) as unknown as BlockProps['actions']['onClick'];
  const { emitData } = setup({
    card: { content: { prop: 'content' }, image: { alt: 'A red bike', file: '' } },
    onClick,
  });

  await emitData([{ id: 1, title: 'First' }]);

  expect(screen.getByRole('button', { name: 'A red bike' })).toBeDefined();
});

it('should link a card to the page of a link action', async () => {
  const onClick = Object.assign(vi.fn(), {
    type: 'link',
    href: (data: Item) => `/items/${data.id}`,
  }) as unknown as BlockProps['actions']['onClick'];
  const { emitData } = setup({ onClick });

  await emitData([{ id: 1, title: 'First' }]);

  expect(screen.getByRole('link', { name: 'First' }).getAttribute('href')).toBe('/items/1');
});

it('should not render a control for a card without a click action', async () => {
  const { emitData } = setup();

  await emitData([{ id: 1, title: 'First' }]);

  expect(screen.queryByRole('button')).toBeNull();
  expect(screen.queryByRole('link')).toBeNull();
});

it('should open a card through its subtitle when it has no title', async () => {
  const onClick = Object.assign(vi.fn(), {
    type: 'click',
  }) as unknown as BlockProps['actions']['onClick'];
  const { emitData } = setup({
    card: { content: { prop: 'content' }, subtitle: { prop: 'title' } },
    onClick,
  });

  await emitData([{ id: 1, title: 'First' }]);

  expect(screen.getByRole('button', { name: 'First' })).toBeDefined();
});

it('should give a card without text or image alt a generic name', async () => {
  const onClick = Object.assign(vi.fn(), {
    type: 'click',
  }) as unknown as BlockProps['actions']['onClick'];
  const { emitData } = setup({ card: { content: { prop: 'content' } }, onClick });

  await emitData([{ id: 1, title: 'First' }]);

  expect(screen.getByRole('button', { name: 'openCard' })).toBeDefined();
});

it('should name icon-only footer buttons on mobile by their label', async () => {
  const { emitData } = setup({
    card: {
      content: 'Content',
      footer: [{ icon: 'trash', label: 'Delete' }],
      title: { prop: 'title' },
    },
    isMobile: true,
  });

  await emitData([{ id: 1, title: 'First' }]);

  expect(screen.getByRole('button', { name: 'Delete' })).toBeDefined();
});
