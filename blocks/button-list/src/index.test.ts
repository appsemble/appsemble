// @vitest-environment jsdom

import { EventEmitter } from 'node:events';
import { readFileSync } from 'node:fs';

import { remap, type Remapper } from '@appsemble/lang-sdk';
import { type BootstrapParams } from '@appsemble/sdk';
import { screen } from '@testing-library/dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const sdk = vi.hoisted(() => ({ bootstrap: vi.fn() }));

vi.mock('@appsemble/sdk', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@appsemble/sdk')>()),
  bootstrap: sdk.bootstrap,
}));

await import('./index.js');

const mount = sdk.bootstrap.mock.calls[0][0] as (params: BootstrapParams) => HTMLElement;

beforeEach(() => {
  const style = document.createElement('style');
  style.textContent = readFileSync(new URL(import.meta.resolve('bulma/css/bulma.min.css')), 'utf8');
  document.head.append(style);
});

afterEach(() => {
  document.head.replaceChildren();
  document.body.replaceChildren();
});

function renderButtons(
  data: unknown,
  listen = true,
): {
  ee: EventEmitter;
  submitted: unknown[];
} {
  // eslint-disable-next-line unicorn/prefer-event-target
  const ee = new EventEmitter();
  const submitted: unknown[] = [];
  const params = {
    actions: {
      onClick(value: unknown) {
        submitted.push(value);
        return Promise.resolve(value);
      },
    },
    data,
    events: {
      on: {
        data(callback: (value: unknown) => void) {
          if (listen) {
            ee.on('data', callback);
          }
          return listen;
        },
      },
    },
    parameters: {
      buttons: [
        { label: 'Apply settings', disable: { prop: 'disabled' }, hide: { prop: 'hidden' } },
      ],
    },
    utils: {
      remap: (mapper: Remapper, value: unknown) => remap(mapper, value, {} as never),
    },
  } as unknown as BootstrapParams;
  document.body.append(mount(params));
  return { ee, submitted };
}

it.each([true, false])('disables an initial action with a data listener set to %s', (listen) => {
  const { submitted } = renderButtons({ disabled: true }, listen);
  const button = screen.getByRole<HTMLButtonElement>('button', { name: 'Apply settings' });
  expect(button.disabled).toBe(true);
  button.click();
  expect(submitted).toStrictEqual([]);
});

it('enables an action when later data permits it and submits the current data', () => {
  const { ee, submitted } = renderButtons({ disabled: true });
  const button = screen.getByRole<HTMLButtonElement>('button', { name: 'Apply settings' });
  ee.emit('data', { disabled: false, value: 42 });
  expect(button.disabled).toBe(false);
  button.click();
  expect(submitted).toStrictEqual([{ disabled: false, value: 42 }]);
});

it('hides an initial action and updates its visibility when new data arrives', () => {
  const { ee } = renderButtons({ hidden: true });
  expect(screen.queryByRole('button', { name: 'Apply settings' })).toBeNull();
  ee.emit('data', { hidden: false });
  expect(screen.getByRole('button', { name: 'Apply settings' })).not.toBeNull();
  ee.emit('data', { hidden: true });
  expect(screen.queryByRole('button', { name: 'Apply settings' })).toBeNull();
});
