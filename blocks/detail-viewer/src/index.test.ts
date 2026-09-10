// @vitest-environment jsdom

import { EventEmitter } from 'node:events';

import { remap, type Remapper } from '@appsemble/lang-sdk';
import { Context, type BlockProps } from '@appsemble/preact';
import { act, cleanup, render, screen } from '@testing-library/preact';
import { h } from 'preact';
import { afterEach, expect, it } from 'vitest';

import { DetailViewer } from './index.js';

afterEach(cleanup);

function renderDetails(data: unknown, listen: boolean): EventEmitter {
  // eslint-disable-next-line unicorn/prefer-event-target
  const ee = new EventEmitter();
  const props: BlockProps = {
    actions: {},
    data,
    events: {
      emit: {},
      on: {
        data(callback) {
          if (listen) {
            ee.on('details', callback);
          }
          return listen;
        },
      },
      off: {
        data(callback) {
          ee.off('details', callback);
          return listen;
        },
      },
    },
    parameters: { fields: [{ label: 'Reading', value: { prop: 'value' } }] },
    path: '',
    pathIndex: '',
    ready: () => Promise.resolve(),
    shadowRoot: document.createElement('div').attachShadow({ mode: 'open' }),
    theme: {} as BlockProps['theme'],
    utils: {
      remap: (mapper, input) => remap(mapper as Remapper, input, {} as never),
    } as BlockProps['utils'],
  };
  render(h(Context.Provider, { value: props }, h(DetailViewer, props)));
  return ee;
}

it('shows initial values while listening for later data updates', async () => {
  const ee = renderDetails({ value: 'Initial reading' }, true);
  expect(await screen.findByText('Initial reading')).not.toBeNull();
  act(() => {
    ee.emit('details', { value: 'Updated reading' });
  });
  expect(await screen.findByText('Updated reading')).not.toBeNull();
  expect(screen.queryByText('Initial reading')).toBeNull();
});

it('shows a zero value received from a device', async () => {
  renderDetails({ value: 0 }, false);
  expect(await screen.findByText('0')).not.toBeNull();
});

it('waits for a data event when initial data is absent', async () => {
  const ee = renderDetails(undefined, true);
  expect(screen.queryByText('Reading')).toBeNull();
  act(() => {
    ee.emit('details', { value: 'First reading' });
  });
  expect(await screen.findByText('First reading')).not.toBeNull();
  expect(screen.getByText('Reading')).not.toBeNull();
});
