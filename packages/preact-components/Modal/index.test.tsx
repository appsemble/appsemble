import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { type VNode } from 'preact';
import { useState } from 'preact/hooks';
import { expect, it, vi } from 'vitest';

import { Modal } from './index.js';

it('should not render a bulma modal when it is inactive', () => {
  const { container } = render(
    <Modal closeButtonLabel="Close" isActive={false}>
      test
    </Modal>,
  );
  expect(container).toMatchSnapshot();
});

it('should render a bulma modal when it is active', () => {
  const { container } = render(
    <Modal className="is-hidden-desktop" closeButtonLabel="Close" isActive>
      test
    </Modal>,
  );
  expect(container).toMatchSnapshot();
});

it('should close the modal when the close button is clicked', () => {
  const onClose = vi.fn();
  const { getByLabelText } = render(
    <Modal closeButtonLabel="Test close" isActive onClose={() => onClose()}>
      test
    </Modal>,
  );
  getByLabelText('Test close').click();
  expect(onClose).toHaveBeenCalledWith();
});

it('should close the modal when the background is clicked', () => {
  const onClose = vi.fn();
  render(
    <Modal closeButtonLabel="Close" isActive onClose={() => onClose()}>
      test
    </Modal>,
  );
  // The background is presentational, so it has no role.
  fireEvent.click(screen.getByRole('dialog').querySelector('.modal-background')!);
  expect(onClose).toHaveBeenCalledWith();
});

it('should not close the modal when its content is clicked', () => {
  const onClose = vi.fn();
  render(
    <Modal closeButtonLabel="Close" isActive onClose={onClose}>
      test
    </Modal>,
  );
  fireEvent.click(screen.getByText('test'));
  expect(onClose).not.toHaveBeenCalled();
});

it('should close the modal when escape is pressed', () => {
  const onClose = vi.fn();
  render(
    <Modal closeButtonLabel="Close" isActive onClose={() => onClose()}>
      test
    </Modal>,
  );
  fireEvent.keyDown(screen.getByText('test'), { key: 'Escape' });
  expect(onClose).toHaveBeenCalledWith();
});

it('should close the modal on a close request of the browser', () => {
  const onClose = vi.fn();
  render(
    <Modal closeButtonLabel="Close" isActive onClose={() => onClose()}>
      test
    </Modal>,
  );
  const cancel = new Event('cancel', { cancelable: true });
  fireEvent(screen.getByRole('dialog'), cancel);

  // The dialog is closed by the component, so it can transition out.
  expect(cancel.defaultPrevented).toBe(true);
  expect(onClose).toHaveBeenCalledWith();
});

it('should show the modal again when it is reopened while it transitions out', async () => {
  function Page(): VNode {
    const [isActive, setIsActive] = useState(false);

    return (
      <>
        <button onClick={() => setIsActive(true)} type="button">
          Open
        </button>
        <Modal closeButtonLabel="Close" isActive={isActive} onClose={() => setIsActive(false)}>
          test
        </Modal>
      </>
    );
  }

  render(<Page />);
  fireEvent.click(screen.getByRole('button', { name: 'Open' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Close' }));

  fireEvent.click(screen.getByRole('button', { name: 'Open' }));

  await waitFor(() =>
    expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true),
  );
});
