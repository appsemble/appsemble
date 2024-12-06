import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';

import { Select } from './index.js';
import { Option } from '../Option/index.js';

it('should render a select component', () => {
  const onChange = vi.fn();
  render(
    <Select data-testid="select-test" onChange={onChange} value="hmm">
      <Option value="hmm">Hmm</Option>
      <Option value="hmm2">Hmm 2</Option>
    </Select>,
  );
  const testSelect = screen.getByTestId('select-test');
  expect(testSelect).toMatchSnapshot();
});

it('should fire onChange function', async () => {
  const onChange = vi.fn();
  render(
    <Select data-testid="select-test" onChange={() => onChange()} value="hmm">
      <Option value="hmm">Hmm</Option>
      <Option value="hmm2">Hmm 2</Option>
    </Select>,
  );
  const select = screen.getByTestId('select-test');
  await userEvent.selectOptions(select, 'Hmm 2');
  expect(onChange).toHaveBeenCalledWith();
});
