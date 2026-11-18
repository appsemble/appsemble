import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { userEvent } from '@testing-library/user-event';
import { type ComponentChildren, type VNode } from 'preact';
import { useState } from 'preact/hooks';
import { describe, expect, it, vi } from 'vitest';

import { ModalCard } from './index.js';
import { IntlProvider } from '../IntlProvider/index.js';

function wrapper({ children }: { readonly children: ComponentChildren }): VNode {
  return <IntlProvider locale="en">{children}</IntlProvider>;
}

it('should not render a modal when it is inactive', () => {
  render(<ModalCard isActive={false}>test</ModalCard>, { wrapper });

  expect(screen.queryByRole('dialog')).toBeNull();
});

it('should render its content in a modal dialog when it is active', () => {
  render(<ModalCard isActive>test</ModalCard>, { wrapper });

  expect(screen.getByRole('dialog').textContent).toBe('test');
});

it('should render as the given component', () => {
  render(
    <ModalCard aria-label="Edit" component="form" isActive>
      test
    </ModalCard>,
    { wrapper },
  );

  expect(screen.getByRole('form', { name: 'Edit' }).textContent).toBe('test');
});

it('should close the modal when the close button is clicked', () => {
  const onClose = vi.fn();
  render(
    <ModalCard closeButtonLabel="Test close" isActive onClose={() => onClose()}>
      test
    </ModalCard>,
    { wrapper },
  );
  fireEvent.click(screen.getByLabelText('Test close'));
  expect(onClose).toHaveBeenCalledWith();
});

it('should close the modal when the background is clicked', async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  render(
    <ModalCard isActive onClose={() => onClose()}>
      test
    </ModalCard>,
    { wrapper },
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
    { wrapper },
  );
  await user.click(screen.getByText('test'));
  expect(onClose).not.toHaveBeenCalled();
});

describe('modal dialog behavior', () => {
  interface PageProps {
    readonly focusName?: boolean;
    readonly closable?: boolean;
  }

  function Page({ closable = true, focusName = false }: PageProps): VNode {
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
    render(<Page />, { wrapper });
    await user.click(screen.getByRole('button', { name: 'Open' }));

    expect(screen.getByRole('dialog', { name: 'Edit lamp' })).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'Edit lamp' })).not.toBeNull();
  });

  it('should give the close button an accessible name', async () => {
    const user = userEvent.setup();
    render(<Page />, { wrapper });
    await user.click(screen.getByRole('button', { name: 'Open' }));

    expect(screen.getByRole('button', { name: 'Close' })).not.toBeNull();
  });

  it('should not render a header when there is no title and it can not be closed', () => {
    render(
      <ModalCard closable={false} isActive>
        test
      </ModalCard>,
      { wrapper },
    );

    expect(screen.queryByRole('heading')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('should close when escape is pressed and return focus to the element that opened it', async () => {
    const user = userEvent.setup();
    render(<Page />, { wrapper });
    const opener = screen.getByRole('button', { name: 'Open' });
    await user.click(opener);
    await user.tab();

    await user.keyboard('{Escape}');

    await waitFor(() => expect(document.activeElement).toBe(opener));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('should return focus to the element that opened it when the close button is clicked', async () => {
    const user = userEvent.setup();
    render(<Page focusName />, { wrapper });
    const opener = screen.getByRole('button', { name: 'Open' });
    await user.click(opener);

    await user.click(screen.getByRole('button', { name: 'Close' }));

    await waitFor(() => expect(document.activeElement).toBe(opener));
  });

  it('should not close when escape is pressed if it is not closable', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <ModalCard closable={false} isActive onClose={onClose} title="Edit lamp">
        test
      </ModalCard>,
      { wrapper },
    );

    await user.keyboard('{Escape}');

    expect(onClose).not.toHaveBeenCalled();
  });

  it('should close on a close request of the browser', async () => {
    const user = userEvent.setup();
    render(<Page />, { wrapper });
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
      { wrapper },
    );

    const cancel = new Event('cancel', { cancelable: true });
    fireEvent(screen.getByRole('dialog'), cancel);

    expect(cancel.defaultPrevented).toBe(true);
    expect(onClose).not.toHaveBeenCalled();
  });
});
