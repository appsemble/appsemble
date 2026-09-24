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

function renderRegions(message: Msg | string): { assertive: Element; polite: Element } {
  const { container } = render(
    <MessagesProvider>
      <ShowMessageButton message={message} />
    </MessagesProvider>,
  );
  const assertive = container.querySelector('[aria-live="assertive"]');
  const polite = container.querySelector('[aria-live="polite"]');
  expect(assertive).not.toBeNull();
  expect(polite).not.toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Show' }));
  return { assertive: assertive!, polite: polite! };
}

it('should announce danger messages assertively', () => {
  const { assertive, polite } = renderRegions({ body: 'Saving failed', color: 'danger' });
  expect(assertive.textContent).toBe('Saving failed');
  expect(polite.textContent).toBe('');
});

it('should announce messages without a color assertively', () => {
  const { assertive, polite } = renderRegions('Something went wrong');
  expect(assertive.textContent).toBe('Something went wrong');
  expect(polite.textContent).toBe('');
});

it('should announce other messages politely', () => {
  const { assertive, polite } = renderRegions({ body: 'Saved', color: 'success' });
  expect(polite.textContent).toBe('Saved');
  expect(assertive.textContent).toBe('');
});
