import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { type ReactNode, useState } from 'react';
import { describe, expect, it, onTestFinished, vi } from 'vitest';

import { MessagesProvider, type Msg, useMessages } from './index.js';
import { Modal } from '../Modal/index.js';

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

describe('modal dialogs', () => {
  function Page({ hiddenDialog = false }: { readonly hiddenDialog?: boolean }): ReactNode {
    const [isActive, setIsActive] = useState(true);

    return (
      <MessagesProvider>
        <Modal
          extraClassName={hiddenDialog ? 'is-hidden-desktop' : undefined}
          isActive={isActive}
          onClose={() => setIsActive(false)}
        >
          <ShowMessageButton message="Saving failed" />
        </Modal>
        <ShowMessageButton message="Saving failed" />
      </MessagesProvider>
    );
  }

  it('should show messages inside the open dialog', () => {
    render(<Page />);
    const dialog = screen.getByRole('dialog');

    fireEvent.click(within(dialog).getByRole('button', { name: 'Show' }));

    expect(within(dialog).getByRole('alert').textContent).toBe('Saving failed');
  });

  it('should show messages on the page after the dialog is closed', async () => {
    render(<Page />);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    fireEvent.click(screen.getByRole('button', { name: 'Show' }));

    expect(screen.getByRole('alert').textContent).toBe('Saving failed');
  });

  it('should show messages on the page while a media query hides the dialog', () => {
    const mediaQuery = document.createElement('style');
    mediaQuery.textContent = '.is-hidden-desktop { display: none !important; }';
    document.head.append(mediaQuery);
    onTestFinished(() => mediaQuery.remove());
    render(<Page hiddenDialog />);
    const dialog = screen.getByRole('dialog', { hidden: true });

    fireEvent.click(within(dialog).getByRole('button', { hidden: true, name: 'Show' }));

    const message = screen.getByRole('alert');
    expect(message.textContent).toBe('Saving failed');
    expect(dialog.contains(message)).toBe(false);
  });
});
