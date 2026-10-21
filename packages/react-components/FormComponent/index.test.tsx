import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { expect, it } from 'vitest';

import { getDescription } from './getDescription.js';
import { FormComponent } from './index.js';
import { Input } from '../Input/index.js';

it('should show a string error in place of the help text', () => {
  render(
    <IntlProvider locale="en">
      <FormComponent error="Name is required" help="Your full name" id="name" label="Name" required>
        <input id="name" />
      </FormComponent>
    </IntlProvider>,
  );

  expect(screen.getByText('Name is required')).toBeDefined();
  expect(screen.queryByText('Your full name')).toBeNull();
});

it('should describe a valid input by its help text', () => {
  render(
    <FormComponent help="Enter your full name" id="name" label="Name" required>
      <Input id="name" />
    </FormComponent>,
  );
  const input = screen.getByLabelText('Name');
  expect(input.getAttribute('aria-invalid')).toBeNull();
  expect(getDescription(input)).toBe('Enter your full name');
});

it('should mark an input with an error as invalid and describe it by the error', () => {
  render(
    <FormComponent
      error={<span>This field is required</span>}
      help="Enter your full name"
      id="name"
      label="Name"
      required
    >
      <Input id="name" />
    </FormComponent>,
  );
  const input = screen.getByLabelText('Name');
  expect(input.getAttribute('aria-invalid')).toBe('true');
  expect(getDescription(input)).toBe('This field is required');
});

it('should not describe an input without help or error text', () => {
  render(
    <FormComponent id="name" label="Name" required>
      <Input id="name" />
    </FormComponent>,
  );
  expect(screen.getByLabelText('Name').hasAttribute('aria-describedby')).toBe(false);
});
