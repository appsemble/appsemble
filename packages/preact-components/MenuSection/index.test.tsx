import { render, screen } from '@testing-library/preact';
import { expect, it } from 'vitest';

import { MenuSection } from './index.js';

it('should render each child as a list item', () => {
  render(
    <MenuSection className="foo" testId="menu">
      <a href="/a">A</a>
      {null}
      <a href="/b">B</a>
    </MenuSection>,
  );
  const list = screen.getByTestId('menu');
  expect(list.className).toBe('menu-list foo');
  expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toStrictEqual(['A', 'B']);
});

it('should render a label above the list', () => {
  render(
    <MenuSection label="Pages">
      <a href="/a">A</a>
    </MenuSection>,
  );
  const label = screen.getByText('Pages');
  expect(label.nextElementSibling).toBe(screen.getByRole('list'));
});
