import { PredefinedOrganizationRole } from '@appsemble/types';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import axios from 'axios';
import { type ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SubscribePage } from './index.js';
import { type UserOrganization } from '../../components/UserProvider/index.js';

let organizations: Partial<UserOrganization>[];
let emailVerified = true;
const transport = axios.defaults.adapter;

vi.mock('../../components/UserProvider/index.js', () => ({
  useUser: () => ({
    organizations,
    setOrganizations: vi.fn(),
    userInfo: { email_verified: emailVerified },
  }),
}));

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
  it('should only offer organizations whose subscriptions the user may manage', () => {
    organizations = [
      { id: 'owned', name: 'Owned', role: PredefinedOrganizationRole.Owner },
      { id: 'joined', name: 'Joined', role: PredefinedOrganizationRole.Member },
    ];
    renderPage('/en/subscribe/standard');

    expect(screen.getByRole('heading', { name: 'STANDARD' })).toBeDefined();
    expect(screen.getByText('€25 per month')).toBeDefined();
    expect(screen.getByRole('option', { name: 'Owned' })).toBeDefined();
    expect(screen.queryByRole('option', { name: 'Joined' })).toBeNull();
  });

  it('should continue to the activation page of the only eligible organization', () => {
    organizations = [{ id: 'owned', name: 'Owned', role: PredefinedOrganizationRole.Owner }];
    renderPage('/en/subscribe/standard');

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByTestId('path').textContent).toBe(
      '/en/organizations/owned/subscriptions/activate/standard',
    );
  });

  it('should continue to the activation page of the selected organization', () => {
    organizations = [
      { id: 'first', name: 'First', role: PredefinedOrganizationRole.Owner },
      { id: 'second', name: 'Second', role: PredefinedOrganizationRole.Owner },
    ];
    renderPage('/nl/subscribe/basic');

    fireEvent.change(screen.getByLabelText('Organization'), {
      target: { value: 'second' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByTestId('path').textContent).toBe(
      '/nl/organizations/second/subscriptions/activate/basic',
    );
  });

  it('should explain how to subscribe without an eligible organization', () => {
    organizations = [{ id: 'joined', name: 'Joined', role: PredefinedOrganizationRole.Member }];
    renderPage('/en/subscribe/standard');

    expect(screen.getByText(/Create an organization to subscribe to this plan/)).toBeDefined();
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

  it('should offer the free plan', () => {
    organizations = [{ id: 'owned', name: 'Owned', role: PredefinedOrganizationRole.Owner }];
    renderPage('/en/subscribe/free');

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByTestId('path').textContent).toBe(
      '/en/organizations/owned/subscriptions/activate/free',
    );
  });

  it('should continue to the activation page of a newly created organization', async () => {
    organizations = [];
    axios.defaults.adapter = (config) =>
      Promise.resolve({
        data: { id: 'created' },
        status: 201,
        statusText: 'Created',
        headers: {},
        config,
      });
    renderPage('/en/subscribe/standard');

    fireEvent.click(screen.getByRole('button', { name: 'Create new organization' }));
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

  it('should explain why an organization cannot be created before email verification', () => {
    organizations = [];
    emailVerified = false;
    renderPage('/en/subscribe/standard');

    expect(screen.getByText(/you must first verify your email address/)).toBeDefined();
  });
});
