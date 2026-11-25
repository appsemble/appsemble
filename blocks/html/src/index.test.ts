// @vitest-environment jsdom

import { createExampleContext, remap, type Remapper } from '@appsemble/lang-sdk';
import {
  type AppsembleBootstrapEvent,
  type BootstrapFunction,
  type BootstrapParams,
} from '@appsemble/sdk';
import { within } from '@testing-library/dom';
import { afterEach, expect, it, vi } from 'vitest';

const script = document.createElement('script');
let mount: BootstrapFunction;
script.addEventListener('AppsembleBootstrap', (event) => {
  mount = (event as AppsembleBootstrapEvent).detail.fn;
});
const currentScript = vi.spyOn(document, 'currentScript', 'get').mockReturnValue(script);
await import('./index.js');
currentScript.mockRestore();

afterEach(() => {
  document.body.replaceChildren();
});

async function setup(
  data: unknown,
  styles?: Record<string, Record<string, Remapper>>,
  listens = true,
): Promise<{
  schedule: HTMLElement;
  update: (value: unknown) => void;
}> {
  const channel = new EventTarget();
  const host = document.createElement('div');
  document.body.append(host);
  const shadowRoot = host.attachShadow({ mode: 'open' });
  await mount({
    actions: {},
    data,
    parameters: {
      content: `<section aria-label="Night schedule" data-style="schedule" style="height: 12px; color: black">
        <h2 data-content="title"></h2>
      </section>`,
      placeholders: { title: { prop: 'title' } },
      styles,
    },
    shadowRoot,
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
  } as unknown as BootstrapParams);
  return {
    schedule: within(shadowRoot as unknown as HTMLElement).getByRole('region', {
      name: 'Night schedule',
    }),
    update: (value) => channel.dispatchEvent(new CustomEvent('data', { detail: value })),
  };
}

it.each([true, false])(
  'renders initial remapped styles with a data listener set to %s',
  async (listens) => {
    const { schedule } = await setup(
      { title: 'Night time', width: '40%', color: 'coral' },
      { schedule: { '--night-width': { prop: 'width' }, 'background-color': { prop: 'color' } } },
      listens,
    );

    expect(getComputedStyle(schedule).getPropertyValue('--night-width')).toBe('40%');
    expect(getComputedStyle(schedule).backgroundColor).toBe('rgb(255, 127, 80)');
    expect(getComputedStyle(schedule).height).toBe('12px');
    expect(within(schedule).getByRole('heading', { name: 'Night time' })).not.toBeNull();
  },
);

it('updates the appearance and text when new data arrives', async () => {
  const { schedule, update } = await setup(
    { title: 'Night time', width: '40%' },
    { schedule: { '--night-width': { prop: 'width' }, width: { prop: 'width' } } },
  );

  update({ title: 'Longer night', width: '60%' });

  expect(schedule.style.getPropertyValue('--night-width')).toBe('60%');
  expect(schedule.style.width).toBe('60%');
  expect(within(schedule).getByRole('heading', { name: 'Longer night' })).not.toBeNull();
});

it('preserves zero and removes a mapped declaration when its value is cleared', async () => {
  const { schedule, update } = await setup(
    { title: 'Night time', width: 0 },
    { schedule: { '--night-width': { prop: 'width' } } },
  );

  expect(getComputedStyle(schedule).getPropertyValue('--night-width')).toBe('0');
  update({ title: 'No schedule', width: null });
  expect(schedule.style.getPropertyValue('--night-width')).toBe('');
  expect(getComputedStyle(schedule).height).toBe('12px');
});

it('keeps a mapped value from adding unrelated CSS declarations', async () => {
  const { schedule } = await setup(
    { title: 'Night time', width: '40%; color: red' },
    { schedule: { width: { prop: 'width' } } },
  );

  expect(getComputedStyle(schedule).color).toBe('rgb(0, 0, 0)');
  expect(getComputedStyle(schedule).width).toBe('');
});

it('preserves content and static styling without a matching style mapping', async () => {
  const { schedule, update } = await setup({ title: 'Night time' });

  expect(getComputedStyle(schedule).height).toBe('12px');
  update({ title: 'Wake time' });
  expect(within(schedule).getByRole('heading', { name: 'Wake time' })).not.toBeNull();
});
