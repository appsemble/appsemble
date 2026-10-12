import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { type ReactNode, useState } from 'react';
import { createPortal } from 'react-dom';
import { describe, expect, it, vi } from 'vitest';

import { ModalCard } from './index.js';

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
  const { container } = render(<ModalCard isActive={false}>test</ModalCard>);
  expect(container).toMatchSnapshot();
});

it('should render a bulma modal when it is active', () => {
  const { container } = render(<ModalCard isActive>test</ModalCard>);
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
  const { getByRole } = render(
    <ModalCard isActive onClose={() => onClose()}>
      test
    </ModalCard>,
  );
  getByRole('presentation').click();
  expect(onClose).toHaveBeenCalledWith();
});

describe('modal dialog behavior', () => {
  interface PageProps {
    readonly focusName?: boolean;
    readonly closable?: boolean;
    readonly floating?: boolean;
  }

  function Page({ closable = true, floating = false, focusName = false }: PageProps): ReactNode {
    const [isActive, setIsActive] = useState(false);

    return (
      <>
        <button onClick={() => setIsActive(true)} type="button">
          Open
        </button>
        <ModalCard
          closable={closable}
          footer={<button type="button">Save</button>}
          isActive={isActive}
          onClose={() => setIsActive(false)}
          title="Edit lamp"
        >
          {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
          <input aria-label="Name" autoFocus={focusName} />
        </ModalCard>
        <button type="button">Behind</button>
        {floating ? createPortal(<button type="button">Floating</button>, document.body) : null}
      </>
    );
  }

  it('should expose a modal dialog named by its title heading', async () => {
    const user = userEvent.setup();
    render(<Page />);
    await user.click(screen.getByRole('button', { name: 'Open' }));

    const dialog = screen.getByRole('dialog', { name: 'Edit lamp' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(screen.getByRole('heading', { name: 'Edit lamp' })).not.toBeNull();
  });

  it('should give the close button an accessible name', async () => {
    const user = userEvent.setup();
    render(<Page />);
    await user.click(screen.getByRole('button', { name: 'Open' }));

    expect(screen.getByRole('button', { name: 'Close' })).not.toBeNull();
  });

  it('should not render a header when there is no title and it can not be closed', () => {
    render(
      <ModalCard closable={false} isActive>
        test
      </ModalCard>,
    );

    expect(screen.queryByRole('heading')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('should move focus into the dialog when it opens', async () => {
    const user = userEvent.setup();
    render(<Page />);
    await user.click(screen.getByRole('button', { name: 'Open' }));

    expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true);
  });

  it('should keep focus on an element in the dialog that focuses itself on open', async () => {
    const user = userEvent.setup();
    render(<Page focusName />);
    await user.click(screen.getByRole('button', { name: 'Open' }));

    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Name' }));
  });

  it('should wrap focus around inside the dialog when tabbing', async () => {
    const user = userEvent.setup();
    render(<Page />);
    await user.click(screen.getByRole('button', { name: 'Open' }));

    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close' }));
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Name' }));
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Save' }));
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close' }));
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Save' }));
  });

  it('should not let the user tab to the page behind the dialog', async () => {
    const user = userEvent.setup();
    render(<Page />);
    await user.click(screen.getByRole('button', { name: 'Open' }));
    const dialog = screen.getByRole('dialog');

    for (let index = 0; index < 8; index += 1) {
      await user.tab({ shift: index >= 4 });
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
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

  it('should make content added behind the dialog while it is open inert', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Page />);
    await user.click(screen.getByRole('button', { name: 'Open' }));

    rerender(<Page floating />);

    const floating = await screen.findByRole('button', { hidden: true, name: 'Floating' });
    await waitFor(() => expect(floating.closest('[inert]')).not.toBeNull());
  });

  it('should skip hidden controls when wrapping focus around', async () => {
    const user = userEvent.setup();
    render(
      <ModalCard
        closable={false}
        footer={
          <>
            <button type="button">Save</button>
            <button hidden type="button">
              Discard
            </button>
          </>
        }
        isActive
      >
        <button hidden type="button">
          Reset
        </button>
        <input aria-label="Name" />
      </ModalCard>,
    );
    const name = screen.getByRole('textbox', { name: 'Name' });
    const save = screen.getByRole('button', { name: 'Save' });
    await user.click(name);

    await user.tab();
    expect(document.activeElement).toBe(save);
    await user.tab();
    expect(document.activeElement).toBe(name);
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(save);
  });

  it('should close when escape is pressed and return focus to the element that opened it', async () => {
    const user = userEvent.setup();
    render(<Page />);
    const opener = screen.getByRole('button', { name: 'Open' });
    await user.click(opener);
    await user.tab();

    await user.keyboard('{Escape}');

    expect(document.activeElement).toBe(opener);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('should return focus to the element that opened it when the close button is clicked', async () => {
    const user = userEvent.setup();
    render(<Page focusName />);
    const opener = screen.getByRole('button', { name: 'Open' });
    await user.click(opener);

    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(document.activeElement).toBe(opener);
  });

  it('should not close when escape is pressed if it is not closable', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <ModalCard closable={false} isActive onClose={onClose} title="Edit lamp">
        test
      </ModalCard>,
    );

    await user.keyboard('{Escape}');

    expect(onClose).not.toHaveBeenCalled();
  });
});
