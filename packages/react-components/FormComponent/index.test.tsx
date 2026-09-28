import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { expect, it } from 'vitest';

import { FormComponent } from './index.js';

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
