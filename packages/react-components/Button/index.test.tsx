import { fireEvent, render, screen } from '@testing-library/react';
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

it('should not allow to click if the button is clicked', () => {
  const onClick = vi.fn();
  render(
    <Button disabled onClick={onClick}>
      test
    </Button>,
  );
  fireEvent.click(screen.getByText('test'));
  expect(onClick).not.toHaveBeenCalled();
});
