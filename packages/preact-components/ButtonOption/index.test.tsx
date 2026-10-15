import { render, screen } from '@testing-library/preact';
import { expect, it, vi } from 'vitest';

import { ButtonOption } from './index.js';
import * as valuePicker from '../ValuePickerProvider/index.js';

it('should render the component', () => {
  const onChange = vi.fn();
  vi.spyOn(valuePicker, 'useValuePicker').mockReturnValue({
    name: 'test name',
    onChange,
    value: false,
  });
  const { container } = render(<ButtonOption activeClassName="classTest" value="test1" />);
  expect(container).toMatchSnapshot();
});

it('should mark the selected option as pressed', () => {
  vi.spyOn(valuePicker, 'useValuePicker').mockReturnValue({
    name: 'test name',
    onChange: vi.fn(),
    value: 'test1',
  });
  render(
    <>
      <ButtonOption activeClassName="classTest" value="test1">
        Option 1
      </ButtonOption>
      <ButtonOption activeClassName="classTest" value="test2">
        Option 2
      </ButtonOption>
    </>,
  );
  expect(screen.getByRole('button', { name: 'Option 1', pressed: true })).toBeDefined();
  expect(screen.getByRole('button', { name: 'Option 2', pressed: false })).toBeDefined();
});
