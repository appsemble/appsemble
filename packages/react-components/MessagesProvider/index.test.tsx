import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { type ReactNode, useState } from 'react';
import { describe, expect, it, onTestFinished, vi } from 'vitest';

import { MessagesProvider, type Msg, useMessages } from './index.js';
import { Modal } from '../Modal/index.js';
import { trackShadowModalDialogs } from '../useModalDialog/index.js';

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

/**
 * Check whether an element is rendered inside a container, following slots into shadow roots.
 *
 * @param container The container to look for.
 * @param element The element to check.
 * @returns Whether the element is a flat tree descendant of the container.
 */
function isRenderedInside(container: Element, element: Element): boolean {
  let node: Node | null = element;
  while (node) {
    if (node === container) {
      return true;
    }
    node =
      (node instanceof Element && node.assignedSlot) ||
      (node instanceof ShadowRoot ? node.host : node.parentNode);
  }
  return false;
}

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

  function DeletePage(): ReactNode {
    const [isActive, setIsActive] = useState(true);
    const push = useMessages();

    return (
      <Modal isActive={isActive} onClose={() => setIsActive(false)}>
        <button
          onClick={() => {
            push({ body: 'Deleted', color: 'success' });
            setIsActive(false);
          }}
          type="button"
        >
          Delete
        </button>
      </Modal>
    );
  }

  it('should show messages inside the open dialog', () => {
    render(<Page />);
    const dialog = screen.getByRole('dialog');

    fireEvent.click(within(dialog).getByRole('button', { name: 'Show' }));

    expect(within(dialog).getByRole('alert').textContent).toBe('Saving failed');
  });

  it('should announce messages in the open dialog', () => {
    render(<Page />);
    const dialog = screen.getByRole('dialog');
    // A polite live region only announces content added after it is rendered.
    const politeRegion = dialog.querySelector('[aria-live="polite"]');

    fireEvent.click(within(dialog).getByRole('button', { name: 'Show' }));

    expect(politeRegion?.textContent).toBe('Saving failed');
  });

  it('should announce a message that is shown as the dialog closes', () => {
    const { container } = render(
      <MessagesProvider>
        <DeletePage />
      </MessagesProvider>,
    );
    const dialog = screen.getByRole('dialog');
    const pageRegion = [...container.querySelectorAll('[aria-live="polite"]')].find(
      (region) => !dialog.contains(region),
    );

    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(pageRegion?.textContent).toBe('Deleted');
  });

  it('should show a message that is shown as the dialog closes on top of the dialog', () => {
    render(
      <MessagesProvider>
        <DeletePage />
      </MessagesProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    // The dialog stays rendered on top of the page while it transitions out.
    expect(document.elementsFromPoint(0, 0)[0].textContent).toBe('Deleted');
  });

  it('should keep showing messages in a dialog that the browser closes if it is not closable', async () => {
    render(
      <MessagesProvider>
        <Modal closable={false} isActive>
          <ShowMessageButton message="Saving failed" />
        </Modal>
      </MessagesProvider>,
    );
    const dialog = screen.getByRole('dialog') as HTMLDialogElement;
    // A polite live region only announces content added after it is rendered.
    const politeRegion = dialog.querySelector('[aria-live="polite"]');

    // The browser closes a modal dialog on a close request that can't be canceled.
    act(() => dialog.close());
    await waitFor(() => expect(dialog.open).toBe(true));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Show' }));

    expect(politeRegion?.textContent).toBe('Saving failed');
    expect(document.elementsFromPoint(0, 0)[0]).toBe(politeRegion);
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

  it('should show messages in browsers that do not support popovers', async () => {
    const { hidePopover, showPopover } = HTMLElement.prototype;
    // @ts-expect-error The popover API is removed to simulate an older browser.
    delete HTMLElement.prototype.hidePopover;
    // @ts-expect-error The popover API is removed to simulate an older browser.
    delete HTMLElement.prototype.showPopover;
    onTestFinished(() => {
      Object.assign(HTMLElement.prototype, { hidePopover, showPopover });
    });
    render(<Page />);

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    fireEvent.click(screen.getByRole('button', { name: 'Show' }));

    expect(screen.getByRole('alert').textContent).toBe('Saving failed');
  });
});

describe('modal dialogs in a shadow root', () => {
  function renderShadowDialog(): {
    dialog: HTMLDialogElement;
    host: HTMLElement;
    stopTracking: () => void;
  } {
    const { container } = render(
      <MessagesProvider>
        <ShowMessageButton message="Saving failed" />
      </MessagesProvider>,
    );
    const host = document.createElement('div');
    container.append(host);
    const dialog = document.createElement('dialog');
    dialog.innerHTML = '<slot name="messages"></slot>';
    host.attachShadow({ mode: 'open' }).append(dialog);
    const stopTracking = trackShadowModalDialogs(host);
    onTestFinished(stopTracking);
    return { dialog, host, stopTracking };
  }

  function showModal(dialog: HTMLDialogElement): void {
    act(() => {
      dialog.showModal();
      dialog.dispatchEvent(
        new CustomEvent('AppsembleModalDialogShow', {
          bubbles: true,
          composed: true,
          detail: { slot: 'messages' },
        }),
      );
    });
  }

  function close(dialog: HTMLDialogElement): void {
    act(() => {
      dialog.close();
      dialog.dispatchEvent(
        new CustomEvent('AppsembleModalDialogClose', { bubbles: true, composed: true }),
      );
    });
  }

  it('should show messages inside the open dialog', () => {
    const { dialog } = renderShadowDialog();
    showModal(dialog);

    fireEvent.click(screen.getByRole('button', { name: 'Show' }));

    expect(isRenderedInside(dialog, screen.getByRole('alert'))).toBe(true);
  });

  it('should show messages on the page after the dialog is closed', () => {
    const { dialog, host } = renderShadowDialog();
    showModal(dialog);
    close(dialog);

    fireEvent.click(screen.getByRole('button', { name: 'Show' }));

    expect(host.contains(screen.getByRole('alert'))).toBe(false);
  });

  it('should keep the live region of a dialog that is shown again', () => {
    const { dialog, host } = renderShadowDialog();
    showModal(dialog);
    const politeRegion = host.querySelector('[aria-live="polite"]');

    // A dialog that isn't closable is shown again after the browser closes it.
    dialog.close();
    showModal(dialog);
    fireEvent.click(screen.getByRole('button', { name: 'Show' }));

    expect(politeRegion?.textContent).toBe('Saving failed');
  });

  it('should only let the topmost dialog stay on top while it transitions out', () => {
    const { dialog: lower, host } = renderShadowDialog();
    const upper = document.createElement('dialog');
    host.shadowRoot!.append(upper);
    showModal(lower);
    showModal(upper);

    const closeLower = new CustomEvent('AppsembleModalDialogClose', {
      bubbles: true,
      cancelable: true,
      composed: true,
    });
    const closeUpper = new CustomEvent('AppsembleModalDialogClose', {
      bubbles: true,
      cancelable: true,
      composed: true,
    });
    act(() => {
      lower.dispatchEvent(closeLower);
      upper.dispatchEvent(closeUpper);
    });

    expect(closeLower.defaultPrevented).toBe(true);
    expect(closeUpper.defaultPrevented).toBe(false);
  });

  it('should show messages on the page after the shadow host stops being tracked', () => {
    const { dialog, host, stopTracking } = renderShadowDialog();
    showModal(dialog);

    act(stopTracking);
    fireEvent.click(screen.getByRole('button', { name: 'Show' }));

    expect(host.contains(screen.getByRole('alert'))).toBe(false);
  });
});
