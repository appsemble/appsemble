import { expect, it } from 'vitest';

import { type Item } from '../block.js';
import { groupItems } from './bootstrap.js';

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
