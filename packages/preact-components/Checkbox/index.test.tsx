import { fireEvent, render, screen } from '@testing-library/preact';
import { expect, it, vi } from 'vitest';

import { Checkbox } from './index.js';

it('should render a checkbox', () => {
  const onChange = vi.fn();
  render(<Checkbox id="test-random" label="test-checkbox" onChange={onChange} />);
  const checkbox = screen.getByLabelText('test-checkbox');
  fireEvent.click(checkbox);
  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({}), true);
  expect(checkbox).toMatchSnapshot();
});

it('should render a rounded checkbox', () => {
  const onChange = vi.fn();
  render(
    <Checkbox
      id="test-random"
      label="test-checkbox"
      onChange={onChange}
      switch
      switchOptions={{ rounded: true }}
    />,
  );
  const checkbox = screen.getByLabelText('test-checkbox');
  expect(checkbox.classList).toContain('is-rounded');
});
