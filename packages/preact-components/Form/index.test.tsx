import { fireEvent, render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';

import { Form } from './index.js';
import { Input } from '../Input/index.js';

it('should render a form', () => {
  const onSubmit = vi.fn();
  render(
    <Form data-testid="test-submit" onSubmit={onSubmit}>
      <Input />
    </Form>,
  );
  const testForm = screen.getByTestId('test-submit');
  expect(testForm).toMatchSnapshot();
});

it('should call submit function when onSubmit event triggers', () => {
  const onSubmit = vi.fn();
  render(<Form data-testid="test-submit" onSubmit={onSubmit} />);
  const testForm = screen.getByTestId('test-submit');
  fireEvent.submit(testForm);
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({}));
});

it('should not validate before submitting', () => {
  const onSubmit = vi.fn();
  render(
    <Form data-testid="test-submit" onSubmit={onSubmit}>
      <input required />
    </Form>,
  );
  const testForm = screen.getByTestId('test-submit');
  // @ts-expect-error strictNullChecks not assignable to type
  userEvent.clear(testForm.children.item(0));
  fireEvent.submit(testForm);
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({}));
});
