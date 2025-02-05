import { fireEvent, render, screen } from '@testing-library/preact';
import { expect, it, vi } from 'vitest';

import { RadioGroup } from './index.js';
import { RadioButton } from '../RadioButton/index.js';

it('should render a RadioGroup', () => {
  const onChange = vi.fn();
  render(
    <div data-testid="radio-group-comp-parent">
      <RadioGroup onChange={onChange} value="hmm">
        <RadioButton value="hmm">Hmm</RadioButton>
        <RadioButton value="hmm2">Hmm2</RadioButton>
      </RadioGroup>
      ,
    </div>,
  );
  const radioGroup = screen.getByTestId('radio-group-comp-parent');
  expect(radioGroup).toMatchSnapshot();
});

it('should fire the onChange function', () => {
  const onChange = vi.fn();
  render(
    <RadioGroup onChange={onChange} value="hmm">
      <RadioButton id="radio-1" value="hmm">
        Hmm
      </RadioButton>
      <RadioButton id="radio-2" value="hmm2">
        Hmm 2
      </RadioButton>
    </RadioGroup>,
  );
  fireEvent.click(screen.getByLabelText('Hmm 2'), { target: { value: 'hmm2' } });
  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({}), 'hmm2');
});

it('should render an error message', () => {
  const onChange = vi.fn();
  const { container } = render(
    <RadioGroup error onChange={onChange} value="hmm">
      <RadioButton id="radio-1" value="hmm">
        Hmm
      </RadioButton>
      <RadioButton id="radio-2" value="hmm2">
        Hmm 2
      </RadioButton>
    </RadioGroup>,
  );
  expect(container.getElementsByClassName('is-danger').length).toBeGreaterThan(0);
});
