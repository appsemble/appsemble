// @vitest-environment jsdom

import { getDefaultBootstrapParams } from '@appsemble/block-interaction-tests';
import { type BlockProps, Context } from '@appsemble/preact';
import { type Action } from '@appsemble/sdk';
import { cleanup, render, screen, waitFor, within } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { IntlMessageFormat } from 'intl-messageformat';
import { type VNode } from 'preact';
import { useState } from 'preact/hooks';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { SelectionInput } from './index.js';
import { type SelectionChoice } from '../../../block.js';
import messages from '../../../i18n/en.json' with { type: 'json' };

const options = [
  { id: 1, header: 'First song' },
  { id: 2, header: { prop: 'name' }, name: 'Second song' },
  { id: 3 },
];

function Picker({
  initial = [],
  mayRemove = true,
}: {
  readonly initial?: SelectionChoice[];
  readonly mayRemove?: boolean;
}): VNode {
  const [selected, setSelected] = useState(initial);
  return (
    <SelectionInput
      error={null}
      field={{
        name: 'songs',
        type: 'selection',
        label: { static: 'Favorite songs' },
        selection: options,
        addLabel: 'Choose songs',
        disableSearch: true,
        showSelectedInModal: true,
        allowRemovalFromModal: mayRemove,
      }}
      formValues={{ songs: selected }}
      name="songs"
      onChange={(name, value) => setSelected(value as SelectionChoice[])}
    />
  );
}

function renderPicker(props: { initial?: SelectionChoice[]; mayRemove?: boolean } = {}): void {
  const defaults = getDefaultBootstrapParams();
  const noop = Object.assign(() => Promise.resolve(), { type: 'noop' }) as Action;
  const context = {
    ...defaults,
    actions: { onLoad: noop, onPrevious: noop, onSubmit: noop },
    parameters: { fields: [] },
    utils: {
      ...defaults.utils,
      formatMessage(id: keyof typeof messages, values?: Record<string, number | string>) {
        return String(new IntlMessageFormat(messages[id], 'en').format(values));
      },
    },
  } as BlockProps;

  render(
    <Context.Provider value={context}>
      <Picker {...props} />
    </Context.Provider>,
  );
}

beforeEach(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      readonly root = null;

      readonly rootMargin = '0px';

      readonly thresholds = [0];

      observe = vi.fn<IntersectionObserver['observe']>();

      unobserve = vi.fn<IntersectionObserver['unobserve']>();

      disconnect = vi.fn<IntersectionObserver['disconnect']>();

      takeRecords(): IntersectionObserverEntry[] {
        return [];
      }
    },
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('should identify the picker and let users add and remove named choices', async () => {
  const user = userEvent.setup();
  renderPicker();

  await user.click(screen.getByRole('button', { name: 'Choose songs' }));
  const dialog = await screen.findByRole('dialog', { name: 'Favorite songs' });
  expect(within(dialog).getByRole('button', { name: 'Add 3' })).toBeDefined();
  await user.click(within(dialog).getByRole('button', { name: 'Add Second song' }));
  expect(within(dialog).queryByRole('button', { name: 'Add Second song' })).toBeNull();
  await user.click(within(dialog).getByRole('button', { name: 'Remove Second song' }));
  expect(within(dialog).getByRole('button', { name: 'Add Second song' })).toBeDefined();

  await user.click(within(dialog).getByRole('button', { name: 'Add First song' }));
  await user.click(within(dialog).getByRole('button', { name: 'Close selection' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  await user.click(screen.getByRole('button', { name: 'Remove First song' }));
  expect(screen.queryByRole('button', { name: 'Remove First song' })).toBeNull();
});

it('should identify selected choices when removal from the picker is disabled', async () => {
  const user = userEvent.setup();
  renderPicker({ initial: [options[0]], mayRemove: false });

  await user.click(screen.getByRole('button', { name: 'Choose songs' }));
  const dialog = await screen.findByRole('dialog', { name: 'Favorite songs' });
  expect(within(dialog).getByRole('button', { name: 'Selected First song' })).toHaveProperty(
    'disabled',
    true,
  );
  expect(within(dialog).getByRole('button', { name: 'Add Second song' })).toHaveProperty(
    'disabled',
    false,
  );
});
