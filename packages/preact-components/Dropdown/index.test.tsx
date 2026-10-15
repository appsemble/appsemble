import { type BlockProps, Context } from '@appsemble/preact';
import { fa, resolveIcon } from '@appsemble/web-utils';
import { fireEvent, render, screen } from '@testing-library/preact';
import { type ComponentChildren, type VNode } from 'preact';
import { expect, it } from 'vitest';

import { Dropdown } from './index.js';

const block = {
  utils: { fa, resolveIcon: (reference: string) => resolveIcon(reference) },
} as BlockProps;

function Provider({ children }: { readonly children: ComponentChildren }): VNode {
  return <Context.Provider value={block}>{children}</Context.Provider>;
}

it('should hide the children unless trigger button is clicked', () => {
  render(
    <Dropdown label="test-trigger">
      <div>test-div</div>
      <button type="button">test-button</button>
    </Dropdown>,
  );
  const dropdown = screen.getByTestId('dropdown');
  expect(dropdown.classList).not.toContain('is-active');
});

it('should show children when trigger button is clicked', () => {
  render(
    <Dropdown label="test-trigger">
      <div>test-div</div>
      <button type="button">test-button</button>
    </Dropdown>,
  );

  fireEvent.click(screen.getByText('test-trigger'));
  const dropdown = screen.getByTestId('dropdown');
  expect(dropdown.classList).toContain('is-active');
});

it('should render an icon-only trigger as a named button that reports its expanded state', () => {
  render(
    <Dropdown asButton={false} icon="ellipsis-h" label="More options">
      <button type="button">test-button</button>
    </Dropdown>,
    { wrapper: Provider },
  );

  const trigger = screen.getByRole('button', { name: 'More options' });
  expect(trigger.getAttribute('aria-expanded')).toBe('false');

  fireEvent.click(trigger);
  expect(trigger.getAttribute('aria-expanded')).toBe('true');
});
