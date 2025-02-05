import { render, screen } from '@testing-library/preact';
import { expect, it } from 'vitest';

import { FormComponent } from './index.js';
import { Input } from '../Input/index.js';

it('should render a form component with children elements', () => {
  render(
    <FormComponent>
      <Input />
      <Input />
    </FormComponent>,
  );
  const testForm = screen.getByTestId('submit-formcomp');
  expect(testForm).toMatchSnapshot();
});

it('should render a help text', () => {
  render(
    <FormComponent help="test text">
      <Input />
      <Input />
    </FormComponent>,
  );
  const helpText = screen.getByTestId('help-formcomp');
  expect(screen.getByTestId('submit-formcomp').children[1]).toBeInstanceOf(HTMLSpanElement);

  expect(helpText.textContent).toBe('test text');
});

it('should not render a help text if disableHelp is set to true', () => {
  render(
    <FormComponent disableHelp help="test text">
      <Input />
      <Input />
    </FormComponent>,
  );
  expect(screen.getByTestId('submit-formcomp').children[1]).toBeUndefined();
});

it('should render error text with appropriate class names', () => {
  render(
    <FormComponent error="this is an error">
      <Input />
      <Input />
    </FormComponent>,
  );
  const helpText = screen.getByTestId('help-formcomp');
  expect(helpText.classList).toContain('is-danger');
  expect(helpText.textContent).toBe('this is an error');
});

it('should render detailed help text', () => {
  render(
    <FormComponent help="help" helpExtra="this is detailed help">
      <Input />
      <Input />
    </FormComponent>,
  );
  const detailedHelp = screen.getByTestId('help-extra-formcomp');
  expect(detailedHelp.textContent).toBe('this is detailed help');
});

it('should render the specified optional label if the field has a label', () => {
  render(
    <FormComponent label="test label" optionalLabel="Optional label">
      <Input />
      <Input />
    </FormComponent>,
  );
  const optionalLabel = screen.getByTestId('tag-formcomp');
  expect(optionalLabel.textContent).toBe('Optional label');
});

it('should render the default optional label', () => {
  render(
    <FormComponent label="test label">
      <Input />
      <Input />
    </FormComponent>,
  );
  const optionalLabel = screen.getByTestId('tag-formcomp');
  expect(optionalLabel.textContent).toBe('(Optional)');
});

it('should render a label', () => {
  render(
    <FormComponent label="test label" required>
      <Input />
    </FormComponent>,
  );
  const optionalLabel = screen.getByTestId('label-formcomp');
  expect(screen.getByTestId('label-formcomp')).toBeInstanceOf(HTMLLabelElement);
  expect(optionalLabel.textContent).toBe('test label');
});
