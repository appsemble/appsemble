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

function showMessage(message: Msg | string): Element | null {
  const { container } = render(
    <MessagesProvider>
      <ShowMessageButton message={message} />
    </MessagesProvider>,
  );
  // A polite live region only announces content added after it is rendered.
  const politeRegion = container.querySelector('[aria-live="polite"]');
  fireEvent.click(screen.getByRole('button', { name: 'Show' }));
  return politeRegion;
}

it('should announce danger messages assertively', () => {
  showMessage({ body: 'Saving failed', color: 'danger' });
  expect(screen.getByRole('alert').textContent).toBe('Saving failed');
});

it('should announce messages without a color assertively', () => {
  showMessage('Something went wrong');
  expect(screen.getByRole('alert').textContent).toBe('Something went wrong');
});

it('should announce other messages politely', () => {
  const politeRegion = showMessage({ body: 'Saved', color: 'success' });
  expect(screen.queryByRole('alert')).toBeNull();
  expect(politeRegion?.textContent).toBe('Saved');
});
