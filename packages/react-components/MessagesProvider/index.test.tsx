import { fireEvent, render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { expect, it, vi } from 'vitest';

import { MessagesProvider, type Msg, useMessages } from './index.js';

vi.mock('react-intl', async () => {
  const reactIntl = (await vi.importActual('react-intl')) as typeof import('react-intl');
  const intl = reactIntl.createIntl({
    locale: 'en',
  });

  return {
    ...reactIntl,
    useIntl: () => intl,
  };
});

function ShowMessageButton({ message }: { readonly message: Msg | string }): ReactNode {
  const push = useMessages();
  return (
    <button onClick={() => push(message)} type="button">
      Show
    </button>
  );
}

it('should announce danger messages as an alert', () => {
  render(
    <MessagesProvider>
      <ShowMessageButton message={{ body: 'Saving failed', color: 'danger' }} />
    </MessagesProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Show' }));
  expect(screen.getByRole('alert').textContent).toBe('Saving failed');
});

it('should announce messages without a color as an alert', () => {
  render(
    <MessagesProvider>
      <ShowMessageButton message="Something went wrong" />
    </MessagesProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Show' }));
  expect(screen.getByRole('alert').textContent).toBe('Something went wrong');
});

it('should announce other messages politely from a live region rendered before the message', () => {
  const { container } = render(
    <MessagesProvider>
      <ShowMessageButton message={{ body: 'Saved', color: 'success' }} />
    </MessagesProvider>,
  );
  const liveRegion = container.querySelector('[aria-live="polite"]');
  expect(liveRegion).not.toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Show' }));
  expect(liveRegion!.contains(screen.getByText('Saved'))).toBe(true);
  expect(screen.queryByRole('alert')).toBeNull();
});
