import { fireEvent, render, screen } from '@testing-library/preact';
import { expect, it, vi } from 'vitest';

import { Button } from './index.js';

it('should render a button with text `test`', () => {
  render(<Button>test</Button>);
  const button = screen.getByText('test');
  expect(button).toMatchSnapshot();
});

it('should execute a function when the button is clicked', () => {
  const onClick = vi.fn();
  render(<Button onClick={onClick}>test</Button>);
  fireEvent.click(screen.getByText('test'));
  expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }));
});

it('should support loading state', () => {
  render(<Button loading>test</Button>);
  const button = screen.getByText('test');
  expect(button.classList).toContain('is-loading');
});

it('should support custom classNames', () => {
  render(<Button className="test test-2 test-3">test</Button>);
  const button = screen.getByText('test');
  expect(button.className).toContain('test test-2 test-3');
});
