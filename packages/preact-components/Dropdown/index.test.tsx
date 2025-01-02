import { fireEvent, render, screen } from '@testing-library/preact';
import { expect, it } from 'vitest';

import { Dropdown } from './index.js';

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
