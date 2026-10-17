import { getDefaultBootstrapParams } from '@appsemble/block-interaction-tests';
import { type BlockProps, Context } from '@appsemble/preact';
import { type Parameters } from '@appsemble/sdk';
import { type VNode } from 'preact';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { CollapsibleListComponent } from './index.js';
import { type CollapseButton, type Item } from '../../../block.js';

const items: Item[] = [{ id: 1 }, { id: 2 }];

function renderItems(list: Item[]): VNode {
  return (
    <ul>
      {list.map((item) => (
        <li key={item.id}>{`Item ${item.id}`}</li>
      ))}
    </ul>
  );
}

function setup({
  index = 1,
  isMobile = false,
  parameters = {},
  title = 'Coffee',
}: {
  index?: number;
  isMobile?: boolean;
  parameters?: Partial<Parameters>;
  title?: string;
} = {}): HTMLElement {
  const defaults = getDefaultBootstrapParams();
  const props = {
    ...defaults,
    parameters: { item: {}, ...parameters },
    utils: { ...defaults.utils, isMobile },
  } as unknown as BlockProps;

  render(
    <Context.Provider value={props}>
      <CollapsibleListComponent
        index={index}
        items={items}
        renderItems={renderItems}
        title={title}
      />
    </Context.Provider>,
  );

  return screen.getByRole('button');
}

function classesOf(button: HTMLElement): string[] {
  return [...button.classList];
}

function iconOf(button: HTMLElement): string | undefined {
  return button.querySelector('i')?.className;
}

/**
 * Read the visible content of a button in rendering order.
 *
 * @param button The button to read.
 * @returns The icon names and label texts of the button from left to right.
 */
function contentOrder(button: HTMLElement): string[] {
  return [...button.children].map(
    (child) => child.querySelector('i')?.className ?? child.textContent ?? '',
  );
}

describe('default collapse button', () => {
  it('renders as a rounded, normal sized primary button with a chevron on desktop', () => {
    const button = setup();

    expect(classesOf(button)).toStrictEqual(
      expect.arrayContaining(['button', 'is-primary', 'is-rounded', 'is-normal']),
    );
    expect(classesOf(button)).not.toContain('is-inverted');
    expect(classesOf(button)).not.toContain('is-outlined');
    expect(classesOf(button)).not.toContain('is-light');
    expect(iconOf(button)).toBe('chevron-down');
  });

  it('renders small on mobile', () => {
    const button = setup({ isMobile: true });

    expect(classesOf(button)).toStrictEqual(expect.arrayContaining(['is-small']));
    expect(classesOf(button)).not.toContain('is-normal');
  });

  it('switches to a chevron up while expanded', async () => {
    const button = setup();

    await userEvent.click(button);

    expect(iconOf(button)).toBe('chevron-up');
  });
});

describe('configured collapse button', () => {
  it('applies the configured color and style modifiers', () => {
    const button = setup({
      parameters: {
        collapseButton: { color: 'info', inverted: true, light: true, outlined: true },
      },
    });

    expect(classesOf(button)).toStrictEqual(
      expect.arrayContaining(['is-info', 'is-inverted', 'is-light', 'is-outlined', 'is-rounded']),
    );
    expect(classesOf(button)).not.toContain('is-primary');
  });

  it('is not rounded when rounded is disabled', () => {
    const button = setup({ parameters: { collapseButton: { rounded: false } } });

    expect(classesOf(button)).not.toContain('is-rounded');
  });

  it('applies the configured size on mobile too', () => {
    const button = setup({ isMobile: true, parameters: { collapseButton: { size: 'large' } } });

    expect(classesOf(button)).toStrictEqual(expect.arrayContaining(['is-large']));
    expect(classesOf(button)).not.toContain('is-small');
  });

  it('swaps between the configured icons when toggled', async () => {
    const button = setup({
      parameters: { collapseButton: { expandIcon: 'plus', collapseIcon: 'minus' } },
    });

    expect(iconOf(button)).toBe('plus');
    await userEvent.click(button);
    expect(iconOf(button)).toBe('minus');
    await userEvent.click(button);
    expect(iconOf(button)).toBe('plus');
  });
});

describe('collapse button labels', () => {
  const collapseButton: CollapseButton = {
    expandLabel: 'Show more',
    collapseLabel: 'Show less',
    expandIcon: 'plus',
    collapseIcon: 'minus',
  };

  it('shows the label for the current state next to the icon on desktop', async () => {
    const button = setup({ parameters: { collapseButton } });

    expect(button.textContent).toBe('Show more');
    expect(iconOf(button)).toBe('plus');

    await userEvent.click(button);

    expect(button.textContent).toBe('Show less');
    expect(iconOf(button)).toBe('minus');
  });

  it('uses the visible label as the accessible name on desktop', () => {
    setup({ parameters: { collapseButton } });

    expect(screen.queryByRole('button', { name: 'Show more' })).not.toBeNull();
  });

  it('shows only a small icon on mobile, named after the list title', () => {
    const button = setup({ isMobile: true, parameters: { collapseButton } });

    expect(button.textContent).toBe('');
    expect(iconOf(button)).toBe('plus');
    expect(classesOf(button)).toContain('is-small');
    expect(screen.queryByRole('button', { name: 'Coffee' })).not.toBeNull();
  });

  it('shows only the label on desktop when no icon is defined', async () => {
    const button = setup({
      parameters: { collapseButton: { expandLabel: 'Show more', collapseLabel: 'Show less' } },
    });

    expect(button.textContent).toBe('Show more');
    expect(iconOf(button)).toBeUndefined();

    await userEvent.click(button);

    expect(button.textContent).toBe('Show less');
    expect(iconOf(button)).toBeUndefined();
  });

  it('shows a defined icon next to the label only for the state it is defined for', async () => {
    const button = setup({
      parameters: {
        collapseButton: {
          expandIcon: 'plus',
          expandLabel: 'Show more',
          collapseLabel: 'Show less',
        },
      },
    });

    expect(iconOf(button)).toBe('plus');

    await userEvent.click(button);

    expect(button.textContent).toBe('Show less');
    expect(iconOf(button)).toBeUndefined();
  });

  it('falls back to a chevron on mobile when no icon is defined', async () => {
    const button = setup({
      isMobile: true,
      parameters: { collapseButton: { expandLabel: 'Show more', collapseLabel: 'Show less' } },
    });

    expect(button.textContent).toBe('');
    expect(iconOf(button)).toBe('chevron-down');

    await userEvent.click(button);

    expect(button.textContent).toBe('');
    expect(iconOf(button)).toBe('chevron-up');
  });

  it('shows the icon left of the label by default', () => {
    const button = setup({ parameters: { collapseButton } });

    expect(contentOrder(button)).toStrictEqual(['plus', 'Show more']);
  });

  it('shows the icon right of the label when iconPosition is right', async () => {
    const button = setup({
      parameters: { collapseButton: { ...collapseButton, iconPosition: 'right' } },
    });

    expect(contentOrder(button)).toStrictEqual(['Show more', 'plus']);

    await userEvent.click(button);

    expect(contentOrder(button)).toStrictEqual(['Show less', 'minus']);
  });
});

describe('accessibility', () => {
  it('reports the expanded state and shows the items only while expanded', async () => {
    const button = setup();

    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByText('Item 1')).toBeNull();

    await userEvent.click(button);

    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(screen.queryByText('Item 1')).not.toBeNull();
  });

  it('starts expanded for the first list unless startCollapsed is set', () => {
    expect(setup({ index: 0 }).getAttribute('aria-expanded')).toBe('true');
  });

  it('is named after the list title', () => {
    setup({ title: 'Coffee' });

    expect(screen.queryByRole('button', { name: 'Coffee' })).not.toBeNull();
  });

  it('has an accessible name when the list has no title', () => {
    setup({ title: '' });

    // The default test utils return the message id as the formatted message.
    expect(screen.queryByRole('button', { name: 'toggleList' })).not.toBeNull();
  });

  it('can be reached and toggled with the keyboard', async () => {
    const button = setup();

    await userEvent.tab();
    expect(document.activeElement).toBe(button);

    await userEvent.keyboard('{Enter}');
    expect(button.getAttribute('aria-expanded')).toBe('true');

    await userEvent.keyboard(' ');
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('does not toggle on keys that do not activate the button', async () => {
    const button = setup();

    await userEvent.tab();
    await userEvent.keyboard('{Shift}a');

    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('still toggles when clicking the title bar', async () => {
    const button = setup();

    await userEvent.click(screen.getByText('Coffee'));

    expect(button.getAttribute('aria-expanded')).toBe('true');
  });
});
