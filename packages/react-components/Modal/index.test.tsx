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

it('should close the modal when the background is clicked', async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  render(
    <Modal isActive onClose={() => onClose()}>
      test
    </Modal>,
  );
  // The background is presentational, so it has no role.
  await user.click(screen.getByRole('dialog').querySelector('.modal-background')!);
  expect(onClose).toHaveBeenCalledWith();
});

it('should not close the modal when its content is clicked', async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  render(
    <Modal isActive onClose={onClose}>
      test
    </Modal>,
  );
  await user.click(screen.getByText('test'));
  expect(onClose).not.toHaveBeenCalled();
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
      </>
    );
  }

  it('should expose a dialog', async () => {
    const user = userEvent.setup();
    render(<Page />);
    await user.click(screen.getByRole('button', { name: 'Open' }));

    expect(screen.getByRole('dialog')).not.toBeNull();
  });

  it('should give the close button an accessible name', async () => {
    const user = userEvent.setup();
    render(<Page />);
    await user.click(screen.getByRole('button', { name: 'Open' }));

    expect(screen.getByRole('button', { name: 'Close' })).not.toBeNull();
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

  it('should show the modal again when it is reopened while it transitions out', async () => {
    const user = userEvent.setup();
    render(<Page />);
    await user.click(screen.getByRole('button', { name: 'Open' }));
    await user.keyboard('{Escape}');

    await user.click(screen.getByRole('button', { name: 'Open' }));

    expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true);
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
