import { PredefinedOrganizationRole } from '@appsemble/types';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { type ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SubscribePage } from './index.js';
import { type UserOrganization } from '../../components/UserProvider/index.js';

let organizations: Partial<UserOrganization>[];
let emailVerified = true;
let currentPlans: Record<string, string>;
const transport = axios.defaults.adapter;

function respond(config: InternalAxiosRequestConfig): Promise<AxiosResponse> {
  const [, organizationId] = /^\/api\/organizations\/([^/]+)\/subscription$/.exec(config.url) ?? [];
  return Promise.resolve({
    data: organizationId
      ? { organizationId, subscriptionPlan: currentPlans[organizationId] ?? 'free' }
      : { id: 'created' },
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  });
}

vi.mock('../../components/UserProvider/index.js', () => ({
  useUser: () => ({
    organizations,
    setOrganizations: vi.fn(),
    userInfo: { email_verified: emailVerified },
  }),
}));

beforeEach(() => {
  currentPlans = {};
  axios.defaults.adapter = respond;
});

afterEach(() => {
  axios.defaults.adapter = transport;
  emailVerified = true;
});

function CurrentPath(): ReactNode {
  return <p data-testid="path">{useLocation().pathname}</p>;
}

function renderPage(path: string): void {
  render(
    <IntlProvider locale="en" messages={{}}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<SubscribePage />} path="/:lang/subscribe/:subscriptionPlanName" />
          <Route element={<CurrentPath />} path="*" />
        </Routes>
      </MemoryRouter>
    </IntlProvider>,
  );
}

describe('SubscribePage', () => {
  it('should only offer organizations whose subscriptions the user may manage', async () => {
    organizations = [
      { id: 'owned', name: 'Owned', role: PredefinedOrganizationRole.Owner },
      { id: 'joined', name: 'Joined', role: PredefinedOrganizationRole.Member },
    ];
    renderPage('/en/subscribe/standard');

    expect(await screen.findByRole('heading', { name: 'STANDARD' })).toBeDefined();
    expect(screen.getByText('€25 per month')).toBeDefined();
    expect(screen.getByRole('option', { name: 'Owned' })).toBeDefined();
    expect(screen.queryByRole('option', { name: 'Joined' })).toBeNull();
  });

  it('should continue to the activation page of the only eligible organization', async () => {
    organizations = [
      { id: 'subscribed', name: 'Subscribed', role: PredefinedOrganizationRole.Owner },
      { id: 'owned', name: 'Owned', role: PredefinedOrganizationRole.Owner },
    ];
    currentPlans = { subscribed: 'standard' };
    renderPage('/en/subscribe/standard');

    fireEvent.click(await screen.findByRole('button', { name: 'Continue' }));

    expect(screen.getByTestId('path').textContent).toBe(
      '/en/organizations/owned/subscriptions/activate/standard',
    );
  });

  it('should continue to the activation page of the selected organization', async () => {
    organizations = [
      { id: 'first', name: 'First', role: PredefinedOrganizationRole.Owner },
      { id: 'second', name: 'Second', role: PredefinedOrganizationRole.Owner },
    ];
    renderPage('/nl/subscribe/basic');

    fireEvent.change(await screen.findByLabelText('Organization'), {
      target: { value: 'second' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByTestId('path').textContent).toBe(
      '/nl/organizations/second/subscriptions/activate/basic',
    );
  });

  it('should explain how to subscribe without an eligible organization', async () => {
    organizations = [{ id: 'joined', name: 'Joined', role: PredefinedOrganizationRole.Member }];
    renderPage('/en/subscribe/standard');

    expect(
      await screen.findByText(/Create an organization to subscribe to this plan/),
    ).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Continue' })).toBeNull();
  });

  it('should report an unknown plan', () => {
    organizations = [{ id: 'owned', name: 'Owned', role: PredefinedOrganizationRole.Owner }];
    renderPage('/en/subscribe/platinum');

    expect(screen.getByText('This plan does not exist')).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Continue' })).toBeNull();

    fireEvent.click(screen.getByRole('link', { name: 'Go to the Studio home page' }));

    expect(screen.getByTestId('path').textContent).toBe('/en/apps');
  });

  it('should not offer the free plan', () => {
    organizations = [{ id: 'owned', name: 'Owned', role: PredefinedOrganizationRole.Owner }];
    renderPage('/en/subscribe/free');

    expect(screen.getByText('This plan does not exist')).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Continue' })).toBeNull();
  });

  it('should not continue for an organization already on the plan', async () => {
    organizations = [
      { id: 'subscribed', name: 'Subscribed', role: PredefinedOrganizationRole.Owner },
    ];
    currentPlans = { subscribed: 'standard' };
    renderPage('/en/subscribe/standard');

    const option = await screen.findByRole<HTMLOptionElement>('option', {
      name: 'Subscribed (already on this plan)',
    });

    expect(option.disabled).toBe(true);
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Continue' }).disabled).toBe(true);
  });

  it('should report plans that could not be loaded', async () => {
    organizations = [{ id: 'owned', name: 'Owned', role: PredefinedOrganizationRole.Owner }];
    axios.defaults.adapter = (config) =>
      Promise.reject(new AxiosError('Internal Server Error', '500', config));
    renderPage('/en/subscribe/standard');

    expect(
      await screen.findByText(
        'Something went wrong when trying to fetch the plans of your organizations.',
      ),
    ).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Continue' })).toBeNull();
  });

  it('should continue to the activation page of a newly created organization', async () => {
    organizations = [];
    renderPage('/en/subscribe/standard');

    fireEvent.click(await screen.findByRole('button', { name: 'Create new organization' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText(/Organization ID/), {
      target: { value: 'created' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create new organization' }));

    await waitFor(() =>
      expect(screen.getByTestId('path').textContent).toBe(
        '/en/organizations/created/subscriptions/activate/standard',
      ),
    );
  });

  it('should explain why an organization cannot be created before email verification', async () => {
    organizations = [];
    emailVerified = false;
    renderPage('/en/subscribe/standard');

    expect(await screen.findByText(/you must first verify your email address/)).toBeDefined();
  });
});
