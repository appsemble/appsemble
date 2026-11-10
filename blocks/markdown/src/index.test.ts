// @vitest-environment jsdom

import { createExampleContext, remap, type Remapper } from '@appsemble/lang-sdk';
import {
  type AppsembleBootstrapEvent,
  type BootstrapFunction,
  type BootstrapParams,
} from '@appsemble/sdk';
import { expect, it, vi } from 'vitest';

const script = document.createElement('script');
let mount: BootstrapFunction;
script.addEventListener('AppsembleBootstrap', (event) => {
  mount = (event as AppsembleBootstrapEvent).detail.fn;
});
const currentScript = vi.spyOn(document, 'currentScript', 'get').mockReturnValue(script);
await import('./index.js');
currentScript.mockRestore();

async function setup(
  data: unknown,
  listens = true,
): Promise<{
  node: Element;
  update: (value: unknown) => void;
}> {
  const channel = new EventTarget();
  const node = await mount({
    data,
    parameters: { content: { prop: 'content' } },
    path: 'instructions',
    utils: {
      remap: (mapper: Remapper, value: unknown) =>
        remap(mapper, value, createExampleContext(new URL(window.location.href), 'en')),
    },
    events: {
      on: {
        data(callback: (value: unknown) => void) {
          if (listens) {
            channel.addEventListener('data', (event) => callback((event as CustomEvent).detail));
          }
          return listens;
        },
      },
    },
  } as BootstrapParams);
  if (!(node instanceof Element)) {
    throw new TypeError('The markdown block must render an element');
  }
  return {
    node,
    update: (value) => channel.dispatchEvent(new CustomEvent('data', { detail: value })),
  };
}

it('renders initial content while subscribed to subsequent data updates', async () => {
  const { node, update } = await setup({ content: '**Bluetooth is ready**' });

  expect(node.textContent).toBe('Bluetooth is ready');

  update({ content: 'Choose your lamp in the browser window.' });

  expect(node.textContent).toBe('Choose your lamp in the browser window.');
});

it.each([undefined, null])(
  'waits for its first data event when initial data is %s',
  async (data) => {
    const { node, update } = await setup(data);

    expect(node.textContent).toBe('');

    update({ content: '## Connection help' });

    expect(node.textContent).toBe('Connection help');
  },
);

it('stops loading without rendering a placeholder when the data event has no data', async () => {
  const { node, update } = await setup(null);

  expect(node.classList.contains('appsemble-loader')).toBe(true);

  update(null);

  expect(node.classList.contains('appsemble-loader')).toBe(false);
  expect(node.textContent).toBe('');
});

it('clears rendered content when a data event has no data', async () => {
  const { node, update } = await setup({ content: '**Bluetooth is ready**' });

  update(null);

  expect(node.textContent).toBe('');
});

it('renders initial content without requiring a data listener', async () => {
  const { node } = await setup({ content: 'Open **Bluetooth settings**.' }, false);

  expect(node.textContent).toBe('Open Bluetooth settings.');
});
