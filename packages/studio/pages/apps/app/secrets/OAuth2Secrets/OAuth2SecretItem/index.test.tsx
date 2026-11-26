import { type AppOAuth2Secret } from '@appsemble/types';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import axios, { type InternalAxiosRequestConfig } from 'axios';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';

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
  icon: 'tag',
  incomplete: false,
  name: 'Example SSO',
  scope: 'openid',
  tokenUrl: 'https://sso.example/token',
  remapper: [{ prop: 'email' }],
  roleMappings: [{ group: '/Admins', role: 'Admin' }],
};

const transport = axios.defaults.adapter;

afterEach(() => {
  axios.defaults.adapter = transport;
});

function renderItem(onUpdated = vi.fn()): void {
  render(
    <IntlProvider locale="en" messages={{}}>
      <MemoryRouter>
        <OAuth2SecretItem onDeleted={vi.fn()} onUpdated={onUpdated} secret={secret} />
      </MemoryRouter>
    </IntlProvider>,
  );
}

async function save(fill: () => void): Promise<Record<string, unknown>> {
  const requests: InternalAxiosRequestConfig[] = [];
  axios.defaults.adapter = (config) => {
    requests.push(config);
    const data = { ...JSON.parse(config.data), id: 1, incomplete: false };
    return Promise.resolve({ config, data, headers: {}, status: 200, statusText: 'OK' });
  };
  const onUpdated = vi.fn();
  renderItem(onUpdated);
  fireEvent.click(screen.getByRole('button', { name: /Example SSO/ }));
  fill();
  fireEvent.click(screen.getByRole('button', { name: 'Save secret' }));
  await waitFor(() =>
    expect(onUpdated).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ id: 1 }), secret),
  );
  expect(requests).toHaveLength(1);
  return JSON.parse(requests[0].data);
}

it('should show that a client secret is set without showing its value', () => {
  renderItem();
  fireEvent.click(screen.getByRole('button', { name: /Example SSO/ }));

  expect(screen.getByLabelText(/Client secret/)).toHaveProperty('value', '');
  expect(
    screen.getByText(
      'A client secret is set. Leave empty to keep it, or enter a new one to replace it.',
    ),
  ).toBeDefined();
});

it('should keep the stored client secret when the field is left empty', async () => {
  const body = await save(() =>
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Renamed SSO' } }),
  );

  expect(body).toMatchObject({ name: 'Renamed SSO' });
  expect(body).not.toHaveProperty('clientSecret');
});

it('should replace the client secret with a new value', async () => {
  const body = await save(() =>
    fireEvent.change(screen.getByLabelText(/Client secret/), { target: { value: 'new-secret' } }),
  );

  expect(body).toMatchObject({ clientSecret: 'new-secret' });
});

it('should save emptied JSON fields without sending null', async () => {
  const body = await save(() => {
    fireEvent.change(screen.getByLabelText(/User info remapper/), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText(/Role mappings/), { target: { value: '' } });
  });

  expect(body).not.toHaveProperty('remapper');
  expect(body).not.toHaveProperty('roleMappings');
});

it('should preview the app’s icon overrides without applying them to Studio’s own fields', () => {
  renderItem();

  const item = screen.getByRole('button', { name: /Example SSO/ });
  const preview = within(item).getByAltText('');
  expect(preview).toHaveProperty('src', 'http://localhost/api/apps/42/assets/label-icon');

  fireEvent.click(item);

  // The opened form shows the Font Awesome tag icon, not the app override.
  expect(screen.getByLabelText('Name')).toBeDefined();
  expect(screen.getAllByAltText('')).toStrictEqual([preview]);
});
