import { fireEvent, render, screen } from '@testing-library/preact';
import { type ComponentChildren, type VNode } from 'preact';
import { expect, it, vi } from 'vitest';

import { IconProvider } from '../IconProvider/index.js';
import { NavbarBurger } from './index.js';

function wrapper({ children }: { readonly children: ComponentChildren }): VNode {
  return (
    <IconProvider apiUrl="https://example.com" appId={42} registry={undefined}>
      {children}
    </IconProvider>
  );
}

it('should draw the burger lines', () => {
  const onClick = vi.fn();
  render(<NavbarBurger active={false} aria-label="menu" onClick={onClick} />, { wrapper });
  const button = screen.getByRole('button', { name: 'menu' });

  expect(button.classList.contains('is-active')).toBe(false);
  expect(button.querySelectorAll('span[aria-hidden="true"]')).toHaveLength(3);
  fireEvent.click(button);
  expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }));
});

it('should be marked active when the menu is open', () => {
  render(<NavbarBurger active aria-label="menu" />, { wrapper });
  expect(screen.getByRole('button', { name: 'menu' }).classList.contains('is-active')).toBe(true);
});

it('should render the app icon overriding the burger icon', () => {
  render(
    <IconProvider
      apiUrl="https://example.com"
      appId={42}
      registry={{ burger: { asset: 'burger', overrides: ['bars'] } }}
    >
      <NavbarBurger active={false} aria-label="menu" />
    </IconProvider>,
  );
  const button = screen.getByRole('button', { name: 'menu' });
  expect(button.querySelector('img')!.getAttribute('src')).toBe(
    'https://example.com/api/apps/42/assets/burger',
  );
  expect(button.querySelectorAll('span[aria-hidden="true"]')).toHaveLength(0);
});
