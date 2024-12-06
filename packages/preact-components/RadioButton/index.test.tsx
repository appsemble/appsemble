import { render, screen } from '@testing-library/preact';
import { beforeEach, expect, it, vi } from 'vitest';

import { RadioButton } from './index.js';
import * as valuePicker from '../ValuePickerProvider/index.js';

const onChange = vi.fn();

beforeEach(() => {
  vi.spyOn(valuePicker, 'useValuePicker').mockReturnValue({
    name: 'test name',
    onChange,
    value: false,
  });
});

it('should render a radio button', () => {
  render(
    <RadioButton id="test-id" value={false}>
      Test Radio
    </RadioButton>,
  );
  const radioInput = screen.getByLabelText('Test Radio');
  expect(radioInput).toMatchSnapshot();
});
