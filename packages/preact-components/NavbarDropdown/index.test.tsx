import { fireEvent, render, screen } from '@testing-library/preact';
import { expect, it } from 'vitest';

import { NavbarDropdown } from './index.js';

function isOpen(): boolean {
  return screen.getByRole('menu').parentElement!.classList.contains('is-active');
}

it('should toggle the menu with its button', () => {
  render(
    <NavbarDropdown label="Profile">
      <a href="/settings">Settings</a>
    </NavbarDropdown>,
  );
  const button = screen.getByRole('button', { name: 'Profile' });

  expect(isOpen()).toBe(false);
  fireEvent.click(button);
  expect(isOpen()).toBe(true);
  fireEvent.click(button);
  expect(isOpen()).toBe(false);
});

it('should close when a menu item is clicked', () => {
  render(
    <NavbarDropdown label="Profile">
      <button type="button">Logout</button>
    </NavbarDropdown>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Profile' }));
  fireEvent.click(screen.getByRole('button', { name: 'Logout' }));
  expect(isOpen()).toBe(false);
});

it('should close on escape', () => {
  render(
    <NavbarDropdown label="Profile">
      <a href="/settings">Settings</a>
    </NavbarDropdown>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Profile' }));
  fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
  expect(isOpen()).toBe(false);
});

it('should close when clicking outside', () => {
  render(
    <NavbarDropdown label="Profile">
      <a href="/settings">Settings</a>
    </NavbarDropdown>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Profile' }));
  fireEvent.mouseDown(document.body);
  expect(isOpen()).toBe(false);
});
