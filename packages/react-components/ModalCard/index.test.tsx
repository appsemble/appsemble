import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { type ReactNode, useState } from 'react';
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

it('should close the modal when the background is clicked', async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  render(
    <ModalCard isActive onClose={() => onClose()}>
      test
    </ModalCard>,
  );
  // The background is presentational, so it has no role.
  await user.click(screen.getByRole('dialog').querySelector('.modal-background')!);
  expect(onClose).toHaveBeenCalledWith();
});

it('should not close the modal when its content is clicked', async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  render(
    <ModalCard isActive onClose={onClose}>
      test
    </ModalCard>,
  );
  await user.click(screen.getByText('test'));
  expect(onClose).not.toHaveBeenCalled();
});

describe('modal dialog behavior', () => {
  interface PageProps {
    readonly focusName?: boolean;
    readonly closable?: boolean;
  }

  function Page({ closable = true, focusName = false }: PageProps): ReactNode {
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
      </>
    );
  }

  it('should expose a modal dialog named by its title heading', async () => {
    const user = userEvent.setup();
    render(<Page />);
    await user.click(screen.getByRole('button', { name: 'Open' }));

    expect(screen.getByRole('dialog', { name: 'Edit lamp' })).not.toBeNull();
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

  it('should keep focus on an element in the dialog that focuses itself on open', async () => {
    const user = userEvent.setup();
    render(<Page focusName />);
    await user.click(screen.getByRole('button', { name: 'Open' }));

    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Name' }));
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

  it('should close on a close request of the browser', async () => {
    const user = userEvent.setup();
    render(<Page />);
    await user.click(screen.getByRole('button', { name: 'Open' }));

    const cancel = new Event('cancel', { cancelable: true });
    fireEvent(screen.getByRole('dialog'), cancel);

    // The dialog is closed by the component, so it can transition out.
    expect(cancel.defaultPrevented).toBe(true);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('should not close on a close request of the browser if it is not closable', () => {
    const onClose = vi.fn();
    render(
      <ModalCard closable={false} isActive onClose={onClose} title="Edit lamp">
        test
      </ModalCard>,
    );

    const cancel = new Event('cancel', { cancelable: true });
    fireEvent(screen.getByRole('dialog'), cancel);

    expect(cancel.defaultPrevented).toBe(true);
    expect(onClose).not.toHaveBeenCalled();
  });
});
