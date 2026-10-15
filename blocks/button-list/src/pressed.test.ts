// @vitest-environment jsdom

import { remap, type Remapper } from '@appsemble/lang-sdk';
import { type BootstrapParams } from '@appsemble/sdk';
import { screen } from '@testing-library/dom';
import { afterEach, expect, it, vi } from 'vitest';

const sdk = vi.hoisted(() => ({ bootstrap: vi.fn() }));

vi.mock('@appsemble/sdk', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@appsemble/sdk')>()),
  bootstrap: sdk.bootstrap,
}));

await import('./index.js');

const mount = sdk.bootstrap.mock.calls[0][0] as (params: BootstrapParams) => HTMLElement;

afterEach(() => document.body.replaceChildren());

function renderButtons(): EventTarget {
  const incoming = new EventTarget();
  const saved = document.createElement('output');
  saved.setAttribute('aria-label', 'Selected room');
  const params = {
    actions: {
      onClick(value: { name: string }) {
        saved.textContent = value.name;
      },
    },
    data: { name: 'Nursery' },
    events: {
      on: {
        data(callback: (value: unknown) => void) {
          incoming.addEventListener('data', (event) => callback((event as CustomEvent).detail));
          return true;
        },
      },
    },
    parameters: {
      buttons: [
        { label: 'Nursery', pressed: { equals: [{ prop: 'name' }, 'Nursery'] } },
        { label: 'Bedroom', pressed: { equals: [{ prop: 'name' }, 'Bedroom'] } },
        { label: 'Save' },
      ],
    },
    utils: { remap: (mapper: Remapper, value: unknown) => remap(mapper, value, {} as never) },
  } as unknown as BootstrapParams;
  document.body.append(mount(params), saved);
  return incoming;
}

it('exposes the initial and updated pressed choices while retaining current action data', () => {
  const incoming = renderButtons();
  expect(screen.getByRole('button', { name: 'Nursery', pressed: true })).toBeDefined();
  expect(screen.getByRole('button', { name: 'Bedroom', pressed: false })).toBeDefined();
  incoming.dispatchEvent(new CustomEvent('data', { detail: { name: 'Bedroom' } }));
  expect(screen.getByRole('button', { name: 'Nursery', pressed: false })).toBeDefined();
  screen.getByRole('button', { name: 'Bedroom', pressed: true }).click();
  expect(screen.getByRole('status', { name: 'Selected room' }).textContent).toBe('Bedroom');
  incoming.dispatchEvent(new CustomEvent('data', { detail: { name: 'Playroom' } }));
  expect(screen.queryByRole('button', { pressed: true })).toBeNull();
});

it('keeps ordinary action buttons outside toggle-button semantics', () => {
  renderButtons();
  expect(screen.getByRole('button', { name: 'Save' }).hasAttribute('aria-pressed')).toBe(false);
});
