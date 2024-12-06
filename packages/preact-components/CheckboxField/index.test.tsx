import { fireEvent, render, screen } from '@testing-library/preact';
import { expect, it, vi } from 'vitest';

import { CheckboxField } from './index.js';

it('should render a checkbox', () => {
  const onChange = vi.fn();
  render(<CheckboxField id="test-random" label="test-checkbox" onChange={onChange} />);
  const checkbox = screen.getByLabelText('test-checkbox');
  fireEvent.click(checkbox);
  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({}), true);
  expect(checkbox).toMatchSnapshot();
});
