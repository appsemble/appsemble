import { fireEvent, render, screen, waitFor, within } from '@testing-library/preact';
import { type VNode } from 'preact';
import { useState } from 'preact/hooks';
import { expect, it, onTestFinished, vi } from 'vitest';

import { ModalCard } from './index.js';

it('should not render a bulma modal when it is inactive', () => {
  const { container } = render(
    <ModalCard closeButtonLabel="Close" isActive={false}>
      test
    </ModalCard>,
  );
  expect(container).toMatchSnapshot();
});

it('should render a bulma modal when it is active', () => {
  const { container } = render(
    <ModalCard closeButtonLabel="Close" isActive>
      test
    </ModalCard>,
  );
  expect(container).toMatchSnapshot();
});

it('should close the modal when the close button is clicked', () => {
  const onClose = vi.fn();
  const { getByLabelText } = render(
    <ModalCard closeButtonLabel="Test close" isActive onClose={() => onClose()}>
      test
    </ModalCard>,
  );
  getByLabelText('Test close').click();
  expect(onClose).toHaveBeenCalledWith();
});

it('should close the modal when the background is clicked', () => {
  const onClose = vi.fn();
  render(
    <ModalCard closeButtonLabel="Close" isActive onClose={() => onClose()}>
      test
    </ModalCard>,
  );
  // The background is presentational, so it has no role.
  fireEvent.click(screen.getByRole('dialog').querySelector('.modal-background')!);
  expect(onClose).toHaveBeenCalledWith();
});

it('should not close the modal when its content is clicked', () => {
  const onClose = vi.fn();
  render(
    <ModalCard closeButtonLabel="Close" isActive onClose={onClose}>
      test
    </ModalCard>,
  );
  fireEvent.click(screen.getByText('test'));
  expect(onClose).not.toHaveBeenCalled();
});

it('should close the modal when escape is pressed', () => {
  const onClose = vi.fn();
  render(
    <ModalCard closeButtonLabel="Close" isActive onClose={() => onClose()}>
      test
    </ModalCard>,
  );
  fireEvent.keyDown(screen.getByText('test'), { key: 'Escape' });
  expect(onClose).toHaveBeenCalledWith();
});

it('should not close the modal when another key is pressed', () => {
  const onClose = vi.fn();
  render(
    <ModalCard closeButtonLabel="Close" isActive onClose={() => onClose()}>
      test
    </ModalCard>,
  );
  fireEvent.keyDown(screen.getByText('test'), { key: 'Enter' });
  expect(onClose).not.toHaveBeenCalled();
});

it('should not close the modal when escape is pressed if it is not closable', () => {
  const onClose = vi.fn();
  render(
    <ModalCard closable={false} closeButtonLabel="Close" isActive onClose={onClose}>
      test
    </ModalCard>,
  );
  fireEvent.keyDown(screen.getByText('test'), { key: 'Escape' });
  expect(onClose).not.toHaveBeenCalled();
});

it('should close the modal on a close request of the browser', () => {
  const onClose = vi.fn();
  render(
    <ModalCard closeButtonLabel="Close" isActive onClose={() => onClose()}>
      test
    </ModalCard>,
  );
  const cancel = new Event('cancel', { cancelable: true });
  fireEvent(screen.getByRole('dialog'), cancel);

  // The dialog is closed by the component, so it can transition out.
  expect(cancel.defaultPrevented).toBe(true);
  expect(onClose).toHaveBeenCalledWith();
});

it('should not close the modal on a close request of the browser if it is not closable', () => {
  const onClose = vi.fn();
  render(
    <ModalCard closable={false} closeButtonLabel="Close" isActive onClose={onClose}>
      test
    </ModalCard>,
  );
  const cancel = new Event('cancel', { cancelable: true });
  fireEvent(screen.getByRole('dialog'), cancel);

  expect(cancel.defaultPrevented).toBe(true);
  expect(onClose).not.toHaveBeenCalled();
});

it('should return focus to the element that opened it when it closes', async () => {
  function Page(): VNode {
    const [isActive, setIsActive] = useState(false);

    return (
      <>
        <button onClick={() => setIsActive(true)} type="button">
          Open
        </button>
        <ModalCard closeButtonLabel="Close" isActive={isActive} onClose={() => setIsActive(false)}>
          test
        </ModalCard>
      </>
    );
  }

  render(<Page />);
  const opener = screen.getByRole('button', { name: 'Open' });
  opener.focus();
  fireEvent.click(opener);
  const close = await screen.findByRole('button', { name: 'Close' });
  close.focus();

  fireEvent.click(close);

  await waitFor(() => expect(document.activeElement).toBe(opener));
});

it('should name the dialog by its title', () => {
  render(
    <ModalCard closeButtonLabel="Close" isActive title={<span>Edit lamp</span>}>
      test
    </ModalCard>,
  );
  expect(screen.getByRole('dialog', { name: 'Edit lamp' })).not.toBeNull();
});

function createShadowContainer(): { container: HTMLElement; host: HTMLElement } {
  const host = document.createElement('div');
  document.body.append(host);
  onTestFinished(() => host.remove());
  const container = document.createElement('div');
  host.attachShadow({ mode: 'open' }).append(container);
  return { container, host };
}

it('should let the shadow host render content inside the modal dialog', () => {
  const { container, host } = createShadowContainer();
  let slot = '';
  host.addEventListener('AppsembleModalDialogShow', (event) => {
    ({ slot } = (event as CustomEvent<{ slot: string }>).detail);
  });
  render(
    <ModalCard closeButtonLabel="Close" isActive>
      test
    </ModalCard>,
    { container },
  );

  const content = document.createElement('span');
  content.slot = slot;
  host.append(content);

  expect(within(container).getByRole('dialog').contains(content.assignedSlot)).toBe(true);
});

it('should tell the shadow host when it stops being shown as a modal dialog', () => {
  const { container, host } = createShadowContainer();
  const closeEvents: Event[] = [];
  host.addEventListener('AppsembleModalDialogClose', (event) => closeEvents.push(event));
  const { rerender } = render(
    <ModalCard closeButtonLabel="Close" isActive>
      test
    </ModalCard>,
    { container },
  );

  rerender(
    <ModalCard closeButtonLabel="Close" isActive={false}>
      test
    </ModalCard>,
  );

  expect(closeEvents).toHaveLength(1);
});

it('should stay on top while it transitions out', () => {
  const { container } = createShadowContainer();
  const { rerender } = render(
    <ModalCard closeButtonLabel="Close" isActive>
      test
    </ModalCard>,
    { container },
  );

  rerender(
    <ModalCard closeButtonLabel="Close" isActive={false}>
      test
    </ModalCard>,
  );

  expect(document.elementsFromPoint(0, 0)[0]).toBe(within(container).getByRole('dialog'));
});

it('should not stay on top while it transitions out if the app says it is not the topmost dialog', () => {
  const { container, host } = createShadowContainer();
  host.addEventListener('AppsembleModalDialogClose', (event) => event.preventDefault());
  const { rerender } = render(
    <ModalCard closeButtonLabel="Close" isActive>
      test
    </ModalCard>,
    { container },
  );

  rerender(
    <ModalCard closeButtonLabel="Close" isActive={false}>
      test
    </ModalCard>,
  );

  expect(document.elementsFromPoint(0, 0)).not.toContain(within(container).getByRole('dialog'));
});
