import { EventEmitter } from 'node:events';

import { createEvents, getDefaultBootstrapParams } from '@appsemble/block-interaction-tests';
import { Context, type BlockProps } from '@appsemble/preact';
import { type Action } from '@appsemble/sdk';
import { act, render, screen } from '@testing-library/preact';
import { h } from 'preact';
import { expect, it } from 'vitest';

import { type Item } from '../block.js';
import { groupItems, List } from './bootstrap.js';

const items: Item[] = [{ id: 1, category: 'Coffee' }, { id: 2, category: 'Tea' }, { id: 3 }];

it('groups items by their groupBy field in the provided group order', () => {
  const { groupedData, leftoverData } = groupItems(items, 'category', ['Tea', 'Coffee']);

  expect(Object.keys(groupedData)).toStrictEqual(['Tea', 'Coffee']);
  expect(groupedData.Coffee).toStrictEqual([items[0]]);
  expect(groupedData.Tea).toStrictEqual([items[1]]);
  expect(leftoverData).toStrictEqual([items[2]]);
});

it('falls back to grouping by field without crashing when the group list is null', () => {
  // A `groups` event whose payload remaps to null previously crashed the grouping effect on
  // `groups.length`; grouping must still work off the items' own field.
  const { groupedData, leftoverData } = groupItems(items, 'category', null);

  expect(groupedData).toStrictEqual({ Coffee: [items[0]], Tea: [items[1]] });
  expect(leftoverData).toStrictEqual([items[2]]);
});

it('shows initial items while listening for later data updates', async () => {
  // eslint-disable-next-line unicorn/prefer-event-target
  const ee = new EventEmitter();
  const action = Object.assign((data: unknown) => Promise.resolve(data), {
    type: 'noop',
  }) as Action;
  const props: BlockProps = {
    ...getDefaultBootstrapParams(),
    actions: { onClick: action, onDrop: action },
    data: { items: [{ id: 1, name: 'Initial item' }] },
    events: createEvents(
      ee,
      Promise.resolve(),
      { listen: { data: {} } },
      { listen: { data: 'items' } },
    ),
    parameters: { base: 'items', item: { header: { title: { prop: 'name' } } } },
  };
  render(h(Context.Provider, { value: props }, h(List, props)));

  expect(await screen.findByRole('heading', { name: 'Initial item' })).not.toBeNull();
  act(() => {
    ee.emit('items', { items: [{ id: 2, name: 'Updated item' }] });
  });
  expect(await screen.findByRole('heading', { name: 'Updated item' })).not.toBeNull();
  expect(screen.queryByRole('heading', { name: 'Initial item' })).toBeNull();
});
