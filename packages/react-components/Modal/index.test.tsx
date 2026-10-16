import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { type ReactNode, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Modal } from './index.js';

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

it('should not render a bulma modal when it is inactive', () => {
  const { container } = render(<Modal isActive={false}>test</Modal>);
  expect(container).toMatchSnapshot();
});

it('should render a bulma modal when it is active', () => {
  const { container } = render(
    <Modal extraClassName="is-hidden-desktop" isActive>
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
  const { getByRole } = render(
    <Modal isActive onClose={() => onClose()}>
      test
    </Modal>,
  );
  getByRole('presentation').click();
  expect(onClose).toHaveBeenCalledWith();
});

describe('modal dialog behavior', () => {
  function Page(): ReactNode {
    const [isActive, setIsActive] = useState(false);

    return (
      <>
        <button onClick={() => setIsActive(true)} type="button">
          Open
        </button>
        <Modal isActive={isActive} onClose={() => setIsActive(false)}>
          <button type="button">Zoom</button>
        </Modal>
        <button type="button">Behind</button>
      </>
    );
  }

  it('should expose a modal dialog', async () => {
    const user = userEvent.setup();
    render(<Page />);
    await user.click(screen.getByRole('button', { name: 'Open' }));

    expect(screen.getByRole('dialog').getAttribute('aria-modal')).toBe('true');
  });

  it('should give the close button an accessible name', async () => {
    const user = userEvent.setup();
    render(<Page />);
    await user.click(screen.getByRole('button', { name: 'Open' }));

    expect(screen.getByRole('button', { name: 'Close' })).not.toBeNull();
  });

  it('should move focus into the dialog and keep it there when tabbing', async () => {
    const user = userEvent.setup();
    render(<Page />);
    await user.click(screen.getByRole('button', { name: 'Open' }));
    const dialog = screen.getByRole('dialog');

    expect(dialog.contains(document.activeElement)).toBe(true);
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Zoom' }));
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close' }));
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Zoom' }));
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close' }));
  });

  it('should make the page behind the dialog inert while it is open', async () => {
    const user = userEvent.setup();
    render(<Page />);
    const behind = screen.getByRole('button', { name: 'Behind' });
    await user.click(screen.getByRole('button', { name: 'Open' }));

    expect(behind.closest('[inert]')).not.toBeNull();

    await user.keyboard('{Escape}');
    expect(behind.closest('[inert]')).toBeNull();
  });

  it('should close when escape is pressed and return focus to the element that opened it', async () => {
    const user = userEvent.setup();
    render(<Page />);
    const opener = screen.getByRole('button', { name: 'Open' });
    await user.click(opener);
    await user.tab();

    await user.keyboard('{Escape}');

    expect(document.activeElement).toBe(opener);
  });

  it('should not close when escape is pressed if it is not closable', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal closable={false} isActive onClose={onClose}>
        test
      </Modal>,
    );

    await user.keyboard('{Escape}');

    expect(onClose).not.toHaveBeenCalled();
  });
});
