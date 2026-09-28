import { type AppOAuth2Secret } from '@appsemble/types';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';

import { OAuth2SecretItem } from './index.js';

vi.mock('../../../index.js', () => ({
  useApp: () => ({
    app: {
      id: 42,
      locked: 'unlocked',
      definition: { icons: { label: { asset: 'label-icon', overrides: ['tag'] } } },
    },
  }),
}));

const secret: AppOAuth2Secret = {
  id: 1,
  authorizationUrl: 'https://sso.example/authorize',
  clientId: 'client',
  clientSecret: 'secret',
  icon: 'tag',
  name: 'Example SSO',
  scope: 'openid',
  tokenUrl: 'https://sso.example/token',
  remapper: undefined,
};

it('should preview the app’s icon overrides without applying them to Studio’s own fields', () => {
  render(
    <IntlProvider locale="en" messages={{}}>
      <MemoryRouter>
        <OAuth2SecretItem onDeleted={vi.fn()} onUpdated={vi.fn()} secret={secret} />
      </MemoryRouter>
    </IntlProvider>,
  );

  const item = screen.getByRole('button', { name: /Example SSO/ });
  const preview = within(item).getByAltText('');
  expect(preview).toHaveProperty('src', 'http://localhost/api/apps/42/assets/label-icon');

  fireEvent.click(item);

  // The opened form shows the Font Awesome tag icon, not the app override.
  expect(screen.getByLabelText('Name')).toBeDefined();
  expect(screen.getAllByAltText('')).toStrictEqual([preview]);
});
