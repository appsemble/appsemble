// @vitest-environment jsdom

import { getDefaultBootstrapParams } from '@appsemble/block-interaction-tests';
import { type IconRegistry, resolveIconReference } from '@appsemble/lang-sdk';
import { type BlockProps, Context } from '@appsemble/preact';
import { render, screen } from '@testing-library/preact';
import { expect, it, vi } from 'vitest';

import { ListInput } from './index.js';
import { type ListField } from '../../../block.js';

const field: ListField = {
  type: 'list',
  name: 'tags',
  label: 'Tags',
  list: [{ value: 'alpha', label: 'Alpha' }],
};

function renderListInput(registry?: IconRegistry): void {
  const params = getDefaultBootstrapParams();
  const props = {
    ...params,
    utils: {
      ...params.utils,
      resolveIcon(reference: string) {
        const resolved = resolveIconReference(reference, registry);
        return resolved.type === 'asset'
          ? { type: 'asset', url: `https://example.com/assets/${resolved.asset}` }
          : resolved;
      },
    },
  } as unknown as BlockProps;

  render(
    <Context.Provider value={props}>
      <ListInput
        error={null}
        field={field}
        formValues={{ tags: ['alpha'] }}
        name="tags"
        onChange={vi.fn()}
      />
    </Context.Provider>,
  );
}

it('should render the app’s override for the chip remove icon', () => {
  renderListInput({ remove: { asset: 'remove-icon', overrides: ['xmark'] } });

  const button = screen.getByRole('button', { name: 'Remove Alpha' });
  expect(button.querySelector('img')?.getAttribute('src')).toBe(
    'https://example.com/assets/remove-icon',
  );
});

it('should render the Font Awesome glyph without an override', () => {
  renderListInput();

  const button = screen.getByRole('button', { name: 'Remove Alpha' });
  expect(button.querySelector('img')).toBeNull();
  expect(button.querySelector('i')).not.toBeNull();
});
