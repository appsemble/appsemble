// @vitest-environment jsdom

import { getDefaultBootstrapParams } from '@appsemble/block-interaction-tests';
import { type BlockProps, Context } from '@appsemble/preact';
import { render, screen } from '@testing-library/preact';
import { userEvent } from '@testing-library/user-event';
import { type VNode } from 'preact';
import { useState } from 'preact/hooks';
import { describe, expect, it } from 'vitest';

import { BooleanInput } from './index.js';
import { type BooleanField, type Values } from '../../../block.js';

function StatefulBooleanInput({ field }: { readonly field: BooleanField }): VNode {
  const [values, setValues] = useState<Values>({ accept: false });

  return (
    <BooleanInput
      error={null}
      field={field}
      formValues={values}
      name="accept"
      onChange={(event, value) => setValues({ accept: value })}
    />
  );
}

function renderBooleanInput(field: BooleanField): void {
  render(
    <Context.Provider value={getDefaultBootstrapParams() as unknown as BlockProps}>
      <StatefulBooleanInput field={field} />
    </Context.Provider>,
  );
}

describe('labelTextFormat markdown', () => {
  it('should render a markdown link next to the checkbox', () => {
    renderBooleanInput({
      type: 'boolean',
      name: 'accept',
      labelText: 'I accept the [terms](https://example.com/terms).',
      labelTextFormat: 'markdown',
    });

    const link = screen.getByRole('link', { name: 'terms' });
    expect(link.getAttribute('href')).toBe('https://example.com/terms');
    expect(screen.getByRole<HTMLInputElement>('checkbox').labels?.[0].textContent).toBe(
      'I accept the terms.',
    );
  });

  it.each(['https://example.com/terms', '/nl/terms-and-conditions-trailer'])(
    'should open %s in a new tab',
    (href) => {
      renderBooleanInput({
        type: 'boolean',
        name: 'accept',
        labelText: `I accept the [terms](${href})`,
        labelTextFormat: 'markdown',
      });

      const link = screen.getByRole('link', { name: 'terms' });
      expect(link.getAttribute('href')).toBe(href);
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    },
  );

  it('should still toggle the checkbox when the text is clicked', async () => {
    renderBooleanInput({
      type: 'boolean',
      name: 'accept',
      labelText: 'I accept the [terms](/terms)',
      labelTextFormat: 'markdown',
    });

    await userEvent.click(screen.getByText(/I accept the/));

    expect(screen.getByRole<HTMLInputElement>('checkbox').checked).toBe(true);
  });

  it('should sanitize the markdown', () => {
    renderBooleanInput({
      type: 'boolean',
      name: 'accept',
      labelText: '[terms](javascript:alert(1))',
      labelTextFormat: 'markdown',
    });

    expect(screen.getByText('terms').getAttribute('href')).toBeNull();
  });
});

describe('labelText without labelTextFormat', () => {
  it('should render markdown syntax verbatim', () => {
    const labelText = '1. Naam *met* _trailer_ has_trailer_license [x](/y)';
    renderBooleanInput({ type: 'boolean', name: 'accept', labelText });

    expect(screen.getByRole('checkbox', { name: labelText })).toBeDefined();
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByRole('list')).toBeNull();
  });
});
