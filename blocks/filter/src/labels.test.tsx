import { getDefaultBootstrapParams } from '@appsemble/block-interaction-tests';
import { type BlockProps, Context } from '@appsemble/preact';
import { type Action } from '@appsemble/sdk';
import { fireEvent, render, screen, within } from '@testing-library/preact';
import { expect, it, vi } from 'vitest';

import { FilterBlock } from './bootstrap.js';
import { type Field } from '../block.js';

function renderFilter(fields: Field[], highlight: string[]): void {
  const props = {
    ...getDefaultBootstrapParams(),
    actions: {
      onLoad: Object.assign(() => Promise.resolve([]), { type: 'resource.query' }),
    } as unknown as Record<string, Action>,
    events: {
      emit: { filtered: () => Promise.resolve(true), refreshed: () => Promise.resolve(true) },
      on: { refresh: () => true },
      off: { refresh: () => true },
    },
    parameters: { fields, highlight },
    ready: vi.fn(),
  } as unknown as BlockProps;

  render(
    <Context.Provider value={props}>
      <FilterBlock {...props} />
    </Context.Provider>,
  );
}

it('should label highlighted fields by their field label', () => {
  renderFilter([{ name: 'name', type: 'string', label: 'Name' }], ['name']);

  expect(screen.getByRole('textbox', { name: 'Name' })).toBeDefined();
});

it('should name a highlighted field without a label by its field name', () => {
  renderFilter([{ name: 'process', type: 'enum', enum: [{ value: 'Maintenance' }] }], ['process']);

  expect(screen.getByRole('combobox', { name: 'process' })).toBeDefined();
});

it('should expose whether the list field options are expanded', () => {
  renderFilter([{ name: 'tags', type: 'list', label: 'Tags', list: [{ value: 'red' }] }], ['tags']);

  fireEvent.click(screen.getByRole('button', { name: 'Tags' }));

  expect(screen.getByRole('button', { name: 'Tags', expanded: true })).toBeDefined();
  expect(screen.getByRole('checkbox', { name: 'red' })).toBeDefined();
});

it('should label the from and to inputs of a date range within its group', () => {
  renderFilter([{ name: 'period', type: 'date-range', label: 'Period' }], ['period']);

  const group = screen.getByRole('group', { name: 'Period' });

  expect(within(group).getByLabelText('fromLabel')).not.toBe(
    within(group).getByLabelText('toLabel'),
  );
});

it('should name the button that opens the filter modal', () => {
  renderFilter([{ name: 'name', type: 'string' }], []);

  expect(screen.getByRole('button', { name: 'openLabel' })).toBeDefined();
});
