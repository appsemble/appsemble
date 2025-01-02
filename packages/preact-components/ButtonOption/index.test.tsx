import { render } from '@testing-library/preact';
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
