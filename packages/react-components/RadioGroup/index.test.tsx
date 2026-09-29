import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { RadioGroup } from './index.js';
import { getDescription } from '../FormComponent/getDescription.js';
import { RadioButton } from '../RadioButton/index.js';

it('should mark the radio buttons as invalid and describe them by the error', () => {
  render(
    <RadioGroup error="Pick an option" name="choice" onChange={vi.fn()} required value="hmm">
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
    expect(getDescription(radio)).toBe('Pick an option');
  }
});

it('should not mark the radio buttons as invalid without an error', () => {
  render(
    <RadioGroup name="choice" onChange={vi.fn()} required value="hmm">
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
