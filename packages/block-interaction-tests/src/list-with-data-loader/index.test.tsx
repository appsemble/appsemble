import { EventEmitter } from 'node:events';

import { DataLoader } from '@appsemble/data-loader/src/bootstrap.js';
import { List } from '@appsemble/list/src/bootstrap.js';
import { type BlockProps, Context } from '@appsemble/preact';
import { render, screen } from '@testing-library/preact';
import { expect, it } from 'vitest';

import '../../types.js';
import { createEvents, getDefaultBootstrapParams } from '../utils.js';

const defaultBootstrapParams = getDefaultBootstrapParams();

it('should render a list with data from a data-loader', async () => {
  // eslint-disable-next-line unicorn/prefer-event-target
  const ee = new EventEmitter();

  let resolveReady: () => void;
  const ready = new Promise<void>((resolve) => {
    resolveReady = resolve;
  });

  const listProps: BlockProps = {
    ...defaultBootstrapParams,
    ready: resolveReady,
    parameters: {
      itemDefinition: {
        header: {
          title: 'test',
        },
      },
    },
    actions: {
      onClick: { type: 'noop' },
      onDrop: { type: 'noop' },
    } as any,
    events: createEvents(ee, ready, { listen: { data: {} } }, { listen: { data: 'data' } }),
  };

  DataLoader({
    ...defaultBootstrapParams,
    parameters: {} as any,
    actions: {
      onLoad: Object.assign(
        // eslint-disable-next-line func-names,prefer-arrow-callback
        function <R>(): Promise<R> {
          return Promise.resolve([{ id: 1 }, { id: 2 }]) as Promise<R>;
        },
        { type: 'noop' as const },
      ),
    } as any,
    events: createEvents(ee, ready, { emit: { data: {} } }, { emit: { data: 'data' } }),
  });

  render(
    <Context.Provider value={listProps}>
      <List dataTestId="test-list-with-data-loader" {...listProps} />
    </Context.Provider>,
  );

  // Wait for the data to load
  await new Promise((r) => {
    setTimeout(r, 100);
  });

  const testSelect = screen.getByTestId('test-list-with-data-loader');
  expect(testSelect).toMatchSnapshot();
});
