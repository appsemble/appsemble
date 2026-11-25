// @vitest-environment jsdom

import { type BlockProps } from '@appsemble/preact';
import { act, fireEvent, render, screen } from '@testing-library/preact';
import { type FunctionComponent } from 'preact';
import { expect, it, vi } from 'vitest';

const preact = vi.hoisted(() => ({ bootstrap: vi.fn() }));

vi.mock('@appsemble/preact', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@appsemble/preact')>()),
  bootstrap: preact.bootstrap,
}));

await import('./index.js');

const Paginator = preact.bootstrap.mock.calls[0][0] as FunctionComponent<BlockProps>;

async function setup(itemsCount?: number): Promise<void> {
  let itemsCountChange: ((count: number) => void) | undefined;
  const props = {
    actions: { onLoad: vi.fn().mockResolvedValue([]) },
    events: {
      emit: { paginated: vi.fn() },
      on: {
        itemsCountChange(callback: (count: number) => void) {
          itemsCountChange = callback;
        },
        reset: vi.fn(),
        toggleTracking: vi.fn(),
      },
      off: { itemsCountChange: vi.fn(), reset: vi.fn(), toggleTracking: vi.fn() },
    },
    parameters: { itemsPerPage: 10 },
    ready: vi.fn(),
    utils: {
      formatMessage: (message: string, args?: Record<string, number>) =>
        args ? `${message} ${Object.values(args).join('/')}` : message,
      isActionOwnerAbortError: () => false,
    },
  } as unknown as BlockProps;

  await act(() => {
    render(<Paginator {...props} />);
  });
  if (itemsCount !== undefined) {
    await act(() => itemsCountChange?.(itemsCount));
  }
}

async function click(name: string): Promise<void> {
  await act(() => {
    fireEvent.click(screen.getByRole('button', { name }));
  });
}

it('should label the pagination and announce the current page', async () => {
  await setup(25);

  expect(screen.getByRole('navigation', { name: 'navigationLabel' })).toBeDefined();

  await click('nextLabel');

  expect(screen.getByText('pageLabel 2/3').getAttribute('aria-live')).toBe('polite');
});

it('should not announce a page before the number of pages is known', async () => {
  await setup();

  expect(screen.queryByText(/pageLabel/)).toBeNull();
});

it('should only enable the buttons that change the page', async () => {
  await setup(25);

  expect(screen.getByRole('button', { name: 'prevLabel' }).hasAttribute('disabled')).toBe(true);
  expect(screen.getByRole('button', { name: 'nextLabel' }).hasAttribute('disabled')).toBe(false);

  await click('nextLabel');
  await click('nextLabel');

  expect(screen.getByRole('button', { name: 'prevLabel' }).hasAttribute('disabled')).toBe(false);
  expect(screen.getByRole('button', { name: 'nextLabel' }).hasAttribute('disabled')).toBe(true);
});
