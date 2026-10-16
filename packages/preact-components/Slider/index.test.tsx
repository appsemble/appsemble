import { fireEvent, render, screen } from '@testing-library/preact';
import { expect, it, vi } from 'vitest';

import { Slider } from './index.js';

it('exposes range progress to themes after value, bounds, and user input changes', () => {
  const { rerender } = render(<Slider aria-label="Brightness" max={60} min={20} value={30} />);
  const slider = screen.getByRole('slider', { name: 'Brightness' });
  expect(slider.style.getPropertyValue('--slider-progress')).toBe('25%');

  rerender(<Slider aria-label="Brightness" max={100} min={20} value={60} />);
  expect(slider.style.getPropertyValue('--slider-progress')).toBe('50%');

  fireEvent.input(slider, { target: { value: 80 } });
  expect(slider.style.getPropertyValue('--slider-progress')).toBe('75%');

  rerender(<Slider aria-label="Brightness" max={100} min={20} value={60} />);
  expect(slider.style.getPropertyValue('--slider-progress')).toBe('50%');
});

it('should render an input element', () => {
  const onChange = vi.fn();
  render(<Slider data-testid="slider-test" onChange={onChange} value="hmm" />);
  const testSlider = screen.getByTestId('slider-test');
  expect(testSlider.attributes.getNamedItem('type')?.value).toBe('range');
  expect(testSlider).toMatchSnapshot();
});

it('should fire onChange function', () => {
  const onChange = vi.fn();
  render(<Slider data-testid="slider-test" onChange={() => onChange()} value={1} />);
  const slider = screen.getByTestId('slider-test');
  fireEvent.change(slider, { target: { value: 5 } });
  expect(onChange).toHaveBeenCalledWith();
});

it('should a slider input with appropriate class names', () => {
  const onChange = vi.fn();
  render(<Slider data-testid="slider-test" error onChange={onChange} />);
  const slider = screen.getByTestId('slider-test');
  expect(slider.classList).toContain('is-danger');
});
