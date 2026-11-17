import { PredefinedOrganizationRole } from '@appsemble/types';
import { fireEvent, render, screen } from '@testing-library/react';
import axios, { AxiosError } from 'axios';
import { type ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { OrganizationSideMenu } from './index.js';
import { OrganizationsRoutes } from '../index.js';
import { AppsRoutes } from '../../apps/index.js';
import { LoginPage } from '../../login/index.js';
import { UserProvider } from '../../../components/UserProvider/index.js';
import { type Organization } from '../../../types.js';

vi.hoisted(() => {
  window.settings = {
    enableRegistration: true,
    logins: [],
    sentryDsn: '',
    sentryEnvironment: '',
  };
});

const transport = axios.defaults.adapter;

beforeEach(() => {
  localStorage.clear();
  axios.defaults.adapter = (config) => {
    const response = {
      data: { name: 'Staff SSO', policy: 'optional', allowedLoginMethods: ['oidc', 'password'] },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    };
    if (config.url.endsWith('/sso/login')) {
      return Promise.resolve(response);
    }
    return Promise.reject(
      new AxiosError('Private metadata', 'ERR_BAD_REQUEST', config, undefined, {
        ...response,
        status: 404,
      }),
    );
  };
});

afterEach(() => {
  axios.defaults.adapter = transport;
  localStorage.clear();
});

const organization: Organization = {
  city: '',
  countryCode: '',
  description: '',
  email: '',
  houseNumber: '',
  iconUrl: '',
  id: 'example',
  invoiceReference: '',
  locale: 'en',
  name: 'Example organization',
  roles: [PredefinedOrganizationRole.Member],
  ssoRoles: [],
  guest: false,
  streetName: '',
  vatIdNumber: '',
  website: '',
  zipCode: '',
};

function renderSideMenu(userOrganization?: Organization): void {
  render(
    <IntlProvider locale="en" messages={{}}>
      <MemoryRouter>
        <OrganizationSideMenu
          mayEdit={false}
          organization={organization}
          url="organizations/example"
          userOrganization={userOrganization}
        />
      </MemoryRouter>
    </IntlProvider>,
  );
}

describe('OrganizationSideMenu', () => {
  it('should hide billing links from organization visitors', () => {
    renderSideMenu();

    expect(screen.queryByRole('link', { name: 'Subscriptions' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Invoices' })).toBeNull();
  });

  it('should show billing links to organization members', () => {
    renderSideMenu(organization);

    expect(screen.getByRole('link', { name: 'Subscriptions' })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Invoices' })).toBeDefined();
  });
});

function LoginDestination(): ReactNode {
  const location = useLocation();
  return (
    <>
      <LoginPage />
      <output aria-label="Sign-in destination">
        {JSON.stringify({
          path: location.pathname,
          parameters: Object.fromEntries(new URLSearchParams(location.search)),
        })}
      </output>
    </>
  );
}

function TargetRoutes(): ReactNode {
  return (
    <Routes>
      <Route element={<OrganizationsRoutes />} path="/organizations/*" />
      <Route element={<AppsRoutes />} path="/apps/*" />
      <Route element={<LoginDestination />} path="/login" />
      <Route element={<p>Collection destination</p>} path="/collections/:collectionId" />
    </Routes>
  );
}

function renderTarget(path: string): void {
  render(
    <IntlProvider locale="en" messages={{}}>
      <MemoryRouter initialEntries={[path]}>
        <UserProvider>
          <Routes>
            <Route element={<TargetRoutes />} path="/:lang/*" />
          </Routes>
        </UserProvider>
      </MemoryRouter>
    </IntlProvider>,
  );
}

it('offers contextual localized sign-in before loading private organization settings', async () => {
  const destination = '/en/organizations/private/settings?view=details#billing';
  renderTarget(destination);
  expect(await screen.findByRole('textbox', { name: 'Email' })).toBeDefined();
  expect(JSON.parse(screen.getByLabelText('Sign-in destination').textContent!)).toStrictEqual({
    path: '/en/login',
    parameters: { view: 'details', redirect: destination, organization: 'private' },
  });
});

it('offers generic localized sign-in when a private app target cannot reveal organization metadata', async () => {
  const destination = '/en/apps/42/private/settings?view=details#content';
  renderTarget(destination);
  expect(await screen.findByRole('textbox', { name: 'Email' })).toBeDefined();
  expect(JSON.parse(screen.getByLabelText('Sign-in destination').textContent!)).toStrictEqual({
    path: '/en/login',
    parameters: { view: 'details', redirect: destination },
  });
});

it('keeps an anonymous private organization profile unavailable', async () => {
  renderTarget('/en/organizations/private');
  expect(
    await screen.findByText('Something went wrong trying to fetch this organization.'),
  ).toBeDefined();
  expect(screen.queryByRole('textbox', { name: 'Email' })).toBeNull();
});

it('opens an organization collection at its global collection URL', async () => {
  localStorage.access_token = `e30.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))}.signature`;
  localStorage.refresh_token = 'refresh';
  const member = { ...organization, roles: [PredefinedOrganizationRole.Owner] };
  const responses: Record<string, unknown> = {
    '/api/users/current': { sub: 'owner', email: 'owner@example.com' },
    '/api/users/current/organizations': [member],
    '/api/organizations/example': organization,
    '/api/organizations/example/subscription': {},
    '/api/organizations/example/app-collections': [
      {
        id: 42,
        name: 'Example collection',
        OrganizationId: organization.id,
        headerImage: '/header.png',
        $expert: { name: 'Example expert' },
      },
    ],
  };
  axios.defaults.adapter = (config) =>
    Promise.resolve({
      data: responses[config.url],
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });
  renderTarget('/en/organizations/example/collections');
  const collection = await screen.findByRole('link', { name: /Example collection/ });

  expect(collection).toHaveProperty('href', 'http://localhost/en/collections/42');
  fireEvent.click(collection);
  expect(await screen.findByText('Collection destination')).toBeDefined();
});
