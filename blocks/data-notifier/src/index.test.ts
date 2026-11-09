// @vitest-environment jsdom

import { type BootstrapParams } from '@appsemble/sdk';
import { screen } from '@testing-library/dom';
import { expect, it, vi } from 'vitest';

const sdk = vi.hoisted(() => ({ bootstrap: vi.fn() }));

vi.mock('@appsemble/sdk', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@appsemble/sdk')>()),
  bootstrap: sdk.bootstrap,
}));

await import('./index.js');

const mount = sdk.bootstrap.mock.calls[0][0] as (params: BootstrapParams) => HTMLElement;

function renderNotifier(): (data: unknown) => void {
  let onData: (data: unknown) => void = () => null;
  const params = {
    events: {
      emit: { data: vi.fn() },
      on: {
        data(callback: (data: unknown) => void) {
          onData = callback;
          return true;
        },
        seed: () => true,
      },
    },
    parameters: {},
    utils: { formatMessage: (message: string) => message },
  } as unknown as BootstrapParams;
  document.body.append(mount(params));
  return onData;
}

it('announces new data and keeps the collapsed message out of reach', () => {
  const emitData = renderNotifier();
  const refresh = screen.getByRole('button', { name: 'buttonLabel' });
  expect(refresh.closest('[inert]')).not.toBeNull();

  emitData([{ id: 1 }]);
  emitData([{ id: 1 }, { id: 2 }]);
  expect(screen.getByRole('status').textContent).toContain('newMessage');
  expect(refresh.closest('[inert]')).toBeNull();

  refresh.click();
  expect(refresh.closest('[inert]')).not.toBeNull();
});
