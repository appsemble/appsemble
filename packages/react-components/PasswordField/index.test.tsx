import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { expect, it } from 'vitest';

import { PasswordField } from './index.js';

it('labels the password field and its controls for revealing and hiding the password', () => {
  render(
    <IntlProvider locale="en" messages={{}}>
      <PasswordField defaultValue="Keep this password" label="Password" name="password" required />
    </IntlProvider>,
  );
  expect(screen.getByLabelText('Password')).toHaveProperty('type', 'password');

  fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
  expect(screen.getByRole('textbox', { name: 'Password' })).toHaveProperty(
    'value',
    'Keep this password',
  );

  fireEvent.click(screen.getByRole('button', { name: 'Hide password' }));
  expect(screen.getByLabelText('Password')).toHaveProperty('type', 'password');
});
