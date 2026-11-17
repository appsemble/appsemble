import {
  type OrganizationSsoConfiguration,
  type OrganizationSsoDomain,
  type OrganizationSsoSettings,
  PredefinedOrganizationRole,
} from '@appsemble/types';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import axios, { AxiosError } from 'axios';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, expect, it } from 'vitest';

import { SingleSignOnPage } from './index.js';

const settings: OrganizationSsoSettings = {
  issuer: 'https://sso.example/realms/staff',
  clientId: 'studio',
  name: 'Staff SSO',
  scope: 'openid email profile',
  groupClaim: 'groups',
  roleMappings: [{ group: '/staff', role: PredefinedOrganizationRole.AppTranslator }],
  policy: 'optional',
  allowedLoginMethods: ['oidc', 'password'],
  managedBy: 'studio',
  hasClientSecret: true,
};
const transport = axios.defaults.adapter;
let configuration: OrganizationSsoSettings | null;
let stored: OrganizationSsoConfiguration | null;
let domains: OrganizationSsoDomain[];

beforeEach(() => {
  configuration = { ...settings };
  stored = { ...settings, clientSecret: 'existing-secret' };
  domains = [];
  axios.defaults.adapter = (config) => {
    if (config.url.includes('/sso/domains')) {
      let data: OrganizationSsoDomain | OrganizationSsoDomain[] = domains;
      if (config.method === 'post') {
        if (config.url.endsWith('/verify')) {
          domains = domains.map((claim) => ({ ...claim, verified: true }));
          [data] = domains;
        } else {
          const { domain } = JSON.parse(config.data) as { domain: string };
          data = {
            domain,
            verified: false,
            managedBy: 'studio',
            recordName: `_appsemble-sso.${domain}`,
            recordValue: 'appsemble-sso=ownership-proof',
          };
          domains = [...domains, data];
        }
      } else if (config.method === 'delete') {
        domains = [];
      }
      return Promise.resolve({ data, status: 200, statusText: 'OK', headers: {}, config });
    }
    if (config.method === 'post' && config.url.endsWith('/sso/login')) {
      return Promise.reject(
        new AxiosError('Provider verification failed', 'ERR_BAD_REQUEST', config, undefined, {
          data: { message: 'Provider verification failed' },
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config,
        }),
      );
    }
    if (config.method === 'put') {
      const body = JSON.parse(config.data) as OrganizationSsoConfiguration;
      stored = { ...body, clientSecret: body.clientSecret ?? stored?.clientSecret };
      configuration = { ...body, managedBy: 'studio', hasClientSecret: true };
    }
    return Promise.resolve({
      data: configuration,
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });
  };
});

afterEach(() => {
  axios.defaults.adapter = transport;
});

function renderSettings(): void {
  render(
    <IntlProvider locale="en" messages={{}}>
      <MemoryRouter initialEntries={['/organizations/example/sso']}>
        <Routes>
          <Route element={<SingleSignOnPage />} path="/organizations/:organizationId/sso" />
        </Routes>
      </MemoryRouter>
    </IntlProvider>,
  );
}

it('should keep the configured client secret when the owner changes other settings', async () => {
  renderSettings();
  fireEvent.change(await screen.findByRole('textbox', { name: 'Provider name' }), {
    target: { value: 'Company sign-in' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save single sign-on settings' }));
  await screen.findByText('Single sign-on settings saved.');

  expect({ name: stored.name, clientSecret: stored.clientSecret }).toStrictEqual({
    name: 'Company sign-in',
    clientSecret: 'existing-secret',
  });
});

it('should allow mapping multiple groups to organization roles', async () => {
  renderSettings();
  await screen.findByRole('textbox', { name: 'Provider name' });
  fireEvent.click(screen.getByRole('button', { name: 'Add group mapping' }));
  const mapping = within(screen.getByRole('group', { name: 'Group mapping 2' }));
  fireEvent.change(mapping.getByRole('textbox', { name: 'Group' }), {
    target: { value: '/content-editors' },
  });
  fireEvent.change(mapping.getByLabelText('Organization role'), {
    target: { value: 'AppContentsManager' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save single sign-on settings' }));

  await waitFor(() =>
    expect(stored.roleMappings).toStrictEqual([
      { group: '/staff', role: PredefinedOrganizationRole.AppTranslator },
      { group: '/content-editors', role: PredefinedOrganizationRole.AppContentsManager },
    ]),
  );
});

it('should prevent editing deployment-managed single sign-on settings', async () => {
  configuration.managedBy = 'deployment';
  renderSettings();

  expect((await screen.findByRole('textbox', { name: 'Issuer URL' })).matches(':disabled')).toBe(
    true,
  );
});

it('should keep an existing connection when verification of a new secret fails', async () => {
  renderSettings();
  fireEvent.change(await screen.findByLabelText(/^Client secret/), {
    target: { value: 'unverified-secret' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Verify connection and save' }));
  await screen.findByText('Provider verification failed');

  expect(stored.clientSecret).toBe('existing-secret');
});

it('should verify a first connection before creating its configuration', async () => {
  configuration = null;
  stored = null;
  renderSettings();
  fireEvent.change(await screen.findByRole('textbox', { name: 'Provider name' }), {
    target: { value: 'Company SSO' },
  });
  fireEvent.change(screen.getByRole('textbox', { name: 'Issuer URL' }), {
    target: { value: 'https://sso.example/realms/company' },
  });
  fireEvent.change(screen.getByRole('textbox', { name: 'Client ID' }), {
    target: { value: 'studio' },
  });
  fireEvent.change(screen.getByLabelText(/^Client secret/), {
    target: { value: 'unverified-secret' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Add group mapping' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Group' }), {
    target: { value: '/owners' },
  });
  fireEvent.change(screen.getByLabelText('Organization role'), {
    target: { value: PredefinedOrganizationRole.Owner },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Verify connection and save' }));
  await screen.findByText('Provider verification failed');

  expect(stored).toBeNull();
});

it('should let an owner add, verify and remove an email alias for discovery', async () => {
  renderSettings();
  fireEvent.change(await screen.findByRole('textbox', { name: 'Email domain' }), {
    target: { value: 'staff.example.com' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Add domain' }));
  await screen.findByText('Pending DNS verification');
  expect(screen.getByText('_appsemble-sso.staff.example.com')).toBeDefined();
  expect(screen.getByText('appsemble-sso=ownership-proof')).toBeDefined();

  fireEvent.click(screen.getByRole('button', { name: 'Verify staff.example.com' }));
  await screen.findByText('Verified');
  expect(screen.queryByText('Pending DNS verification')).toBeNull();

  fireEvent.click(screen.getByRole('button', { name: 'Remove staff.example.com' }));
  await waitFor(() => expect(screen.queryByText('staff.example.com')).toBeNull());
});

it('should show trusted deployment domains without DNS verification controls', async () => {
  configuration.managedBy = 'deployment';
  domains = [
    {
      domain: 'staff.example.com',
      verified: true,
      managedBy: 'deployment',
      recordName: '',
      recordValue: '',
    },
  ];
  renderSettings();

  await screen.findByText('Trusted by deployment configuration');
  expect(screen.queryByRole('button', { name: 'Verify staff.example.com' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Remove staff.example.com' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Add domain' })).toBeNull();
});
