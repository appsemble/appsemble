import { type BlockProps, Context } from '@appsemble/preact';
import { fa, resolveIcon } from '@appsemble/web-utils';
import { fireEvent, render, screen } from '@testing-library/preact';
import { type ComponentChildren, type VNode } from 'preact';
import { expect, it, vi } from 'vitest';

import { RadioGroup } from './index.js';
import { RadioButton } from '../RadioButton/index.js';

const block = {
  utils: { fa, resolveIcon: (reference: string) => resolveIcon(reference) },
} as BlockProps;

function Provider({ children }: { readonly children: ComponentChildren }): VNode {
  return <Context.Provider value={block}>{children}</Context.Provider>;
}

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
    { wrapper: Provider },
  );
  expect(container.getElementsByClassName('is-danger').length).toBeGreaterThan(0);
});

it('should mark the radio buttons as invalid and describe them by the error', () => {
  render(
    <RadioGroup error="Pick an option" name="choice" onChange={vi.fn()} value="hmm">
      <RadioButton id="radio-1" value="hmm">
        Hmm
      </RadioButton>
      <RadioButton id="radio-2" value="hmm2">
        Hmm 2
      </RadioButton>
    </RadioGroup>,
  );
  for (const radio of screen.getAllByRole('radio')) {
    expect(radio.getAttribute('aria-invalid')).toBe('true');
    const description = radio
      .getAttribute('aria-describedby')!
      .split(' ')
      .map((id) => document.getElementById(id)?.textContent)
      .join(' ')
      .trim();
    expect(description).toBe('Pick an option');
  }
});

it('should not mark the radio buttons as invalid without an error', () => {
  render(
    <RadioGroup name="choice" onChange={vi.fn()} value="hmm">
      <RadioButton id="radio-1" value="hmm">
        Hmm
      </RadioButton>
      <RadioButton id="radio-2" value="hmm2">
        Hmm 2
      </RadioButton>
    </RadioGroup>,
  );
  for (const radio of screen.getAllByRole('radio')) {
    expect(radio.getAttribute('aria-invalid')).toBeNull();
  }
});
