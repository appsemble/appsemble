import { fireEvent, render, screen } from '@testing-library/react';
import axios from 'axios';
import { type ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, expect, it } from 'vitest';

import { EditPasswordPage } from './index.js';
import { ResetPasswordPage } from '../reset-password/index.js';

const transport = axios.defaults.adapter;
let requestedContinuation: string | undefined;

beforeEach(() => {
  requestedContinuation = undefined;
  axios.defaults.adapter = (config) => {
    if (config.url === '/api/auth/email/request-password-reset') {
      requestedContinuation = (JSON.parse(config.data) as { redirect?: string }).redirect;
    }
    return Promise.resolve({
      data: undefined,
      status: 204,
      statusText: 'No Content',
      headers: {},
      config,
    });
  };
});

afterEach(() => {
  axios.defaults.adapter = transport;
});

function Destination(): ReactNode {
  const location = useLocation();
  return <p>{`${location.pathname}${location.search}${location.hash}`}</p>;
}

function RecoveryRoutes(): ReactNode {
  return (
    <Routes>
      <Route element={<ResetPasswordPage />} path="/reset-password" />
      <Route element={<EditPasswordPage />} path="/edit-password" />
      <Route element={<Destination />} path="/login" />
    </Routes>
  );
}

function renderRecovery(initialEntry: string): void {
  render(
    <IntlProvider locale="en" messages={{}}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route element={<RecoveryRoutes />} path="/:lang/*" />
        </Routes>
      </MemoryRouter>
    </IntlProvider>,
  );
}

it('requests recovery with a localized personal sign-in continuation and the original destination', async () => {
  renderRecovery('/nl/reset-password?redirect=%2Fnl%2Fapps%2F42&organization=staff#details');
  fireEvent.change(screen.getByRole('textbox', { name: 'Email' }), {
    target: { value: 'staff@example.com' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Send' }));
  await screen.findByText(/Request accepted!/);
  expect(requestedContinuation).toBe(
    '/nl/login?redirect=%2Fnl%2Fapps%2F42&organization=staff&personal=1#details',
  );
});

it('returns to the original sign-in journey after resetting the password', async () => {
  const redirect = '/nl/login?redirect=%2Fnl%2Fapps%2F42&organization=staff&personal=1#details';
  renderRecovery(`/nl/edit-password?${new URLSearchParams({ token: 'reset-token', redirect })}`);
  fireEvent.change(screen.getByLabelText('Password'), {
    target: { value: 'a new password' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
  expect(await screen.findByText(redirect)).toBeDefined();
});

it.each(['', `?${new URLSearchParams({ redirect: 'https://outside.example' })}`])(
  'keeps the normal reset success when no valid continuation is supplied: %s',
  async (search) => {
    renderRecovery(`/nl/edit-password?token=reset-token${search.replace('?', '&')}`);
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'a new password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(await screen.findByText('Password successfully reset!')).toBeDefined();
  },
);
