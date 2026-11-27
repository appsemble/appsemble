import { fireEvent, render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { Confirmation, useConfirmation } from './index.js';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

function DeleteButton({ onDelete }: { readonly onDelete: () => void }): ReactNode {
  const onClick = useConfirmation({
    title: 'Delete item',
    body: 'Are you sure?',
    cancelLabel: 'Cancel',
    confirmLabel: 'Confirm',
    action: onDelete,
  });

  return (
    <button onClick={() => onClick()} type="button">
      Delete
    </button>
  );
}

it('should leave no timers behind if it unmounts right after confirming', async () => {
  const confirmed = Promise.withResolvers<unknown>();
  const { unmount } = render(
    <IntlProvider locale="en">
      <Confirmation>
        <DeleteButton onDelete={() => confirmed.resolve(null)} />
      </Confirmation>
    </IntlProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
  fireEvent.click(screen.getByText('Confirm'));
  await confirmed.promise;

  unmount();
  // Let the jsdom dialog polyfill dispatch its close events.
  vi.advanceTimersByTime(0);

  expect(vi.getTimerCount()).toBe(0);
});
