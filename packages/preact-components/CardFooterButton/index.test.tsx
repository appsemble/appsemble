import { fireEvent, render, screen } from '@testing-library/preact';
import { expect, it, vi } from 'vitest';

import { CardFooterButton } from './index.js';

it('should render a button with className `card-footer-item`', () => {
  render(<CardFooterButton>test</CardFooterButton>);
  const button = screen.getByText('test');
  expect(button.classList).toContain('card-footer-item');
});

it('should allow clicks on the button', () => {
  const onClick = vi.fn();
  render(<CardFooterButton onClick={onClick}>test</CardFooterButton>);
  const button = screen.getByText('test');
  fireEvent.click(button);
  expect(onClick).toHaveBeenCalledWith(expect.objectContaining({}));
});
