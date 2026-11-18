import { fireEvent, render, screen } from '@testing-library/preact';
import { type ComponentChildren, type VNode } from 'preact';
import { expect, it, vi } from 'vitest';

import { MenuButton } from './index.js';
import { IconProvider } from '../IconProvider/index.js';

function wrapper({ children }: { readonly children: ComponentChildren }): VNode {
  return (
    <IconProvider apiUrl="https://example.com" appId={42} registry={undefined}>
      {children}
    </IconProvider>
  );
}

it('should call the click handler', () => {
  const onClick = vi.fn();
  render(
    <MenuButton active={false} onClick={onClick} title="Install">
      Install
    </MenuButton>,
  );
  const button = screen.getByRole('button', { name: 'Install' });
  expect(button.getAttribute('title')).toBe('Install');
  fireEvent.click(button);
  expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }));
});

it('should mark the active item', () => {
  render(
    <MenuButton active onClick={vi.fn()}>
      Home
    </MenuButton>,
  );
  expect(screen.getByRole('button', { name: 'Home' }).classList.contains('is-active')).toBe(true);
});

it('should indent top level items only', () => {
  render(
    <>
      <MenuButton active={false} onClick={vi.fn()}>
        Top
      </MenuButton>
      <MenuButton active={false} isChild onClick={vi.fn()}>
        Child
      </MenuButton>
    </>,
  );
  expect(screen.getByRole('button', { name: 'Top' }).classList.contains('pl-2')).toBe(true);
  expect(screen.getByRole('button', { name: 'Child' }).classList.contains('pl-2')).toBe(false);
});

it('should render an icon', () => {
  render(
    <MenuButton active={false} icon="download" iconColor="primary" onClick={vi.fn()}>
      Install
    </MenuButton>,
    { wrapper },
  );
  const icon = screen.getByRole('button', { name: 'Install' }).querySelector('.icon')!;
  expect(icon.classList.contains('has-text-primary')).toBe(true);
  expect(icon.querySelector('i')!.classList.contains('fa-download')).toBe(true);
});
