import { SimpleForm } from '@appsemble/react-components';
import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';

import { PasswordProtection } from './index.js';

const app = vi.hoisted(() => ({ passwordProtected: false }));

vi.mock('../../index.js', () => ({ useApp: () => ({ app }) }));

function renderPasswordProtection(): void {
  render(
    <IntlProvider locale="en" messages={{}}>
      <MemoryRouter>
        <SimpleForm
          defaultValues={{ passwordProtected: app.passwordProtected, password: '' }}
          onSubmit={vi.fn()}
        >
          <PasswordProtection disabled={false} />
        </SimpleForm>
      </MemoryRouter>
    </IntlProvider>,
  );
}

it('should require a password when password protection is turned on', () => {
  app.passwordProtected = false;
  renderPasswordProtection();
  expect(screen.queryByLabelText('Password')).toBeNull();

  fireEvent.click(screen.getByLabelText('Password protection'));

  expect(screen.getByLabelText('Password')).toHaveProperty('required', true);
});

it('should keep the current password of a password protected app unless a new one is entered', () => {
  app.passwordProtected = true;
  renderPasswordProtection();

  expect(screen.getByLabelText('Password(Optional)')).toHaveProperty('required', false);
});
