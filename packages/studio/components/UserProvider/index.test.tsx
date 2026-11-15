import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios, { type AxiosResponse } from 'axios';
import { type ReactNode } from 'react';
import { afterEach, beforeEach, expect, it } from 'vitest';

import { UserProvider, useUser } from './index.js';

const transport = axios.defaults.adapter;
const responses: Record<string, unknown> = {
  '/api/users/current': { sub: 'user' },
  '/api/users/current/organizations': [{ id: 'owned' }],
};
let pending: Record<string, () => void>;

beforeEach(() => {
  pending = {};
  axios.defaults.adapter = (config) =>
    new Promise<AxiosResponse>((resolve) => {
      pending[config.url] = () =>
        resolve({
          data: responses[config.url],
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        });
    });
});

afterEach(() => {
  axios.defaults.adapter = transport;
  localStorage.clear();
});

function Consumer(): ReactNode {
  const { login, organizations, userInfo } = useUser();
  const payload = btoa(JSON.stringify({ exp: Date.now() / 1e3 + 3600 }));
  return (
    <>
      <button
        onClick={() =>
          login({ access_token: `e30.${payload}.`, refresh_token: 'refresh', token_type: 'bearer' })
        }
        type="button"
      >
        Login
      </button>
      <p data-testid="state">
        {userInfo ? `organizations: ${organizations.length}` : 'logged out'}
      </p>
    </>
  );
}

it('should not expose the logged in user before their organizations have loaded', async () => {
  render(
    <UserProvider>
      <Consumer />
    </UserProvider>,
  );

  fireEvent.click(await screen.findByRole('button', { name: 'Login' }));
  await waitFor(() => expect(Object.keys(pending)).toHaveLength(2));
  await act(() => pending['/api/users/current']());

  expect(screen.getByTestId('state').textContent).toBe('logged out');

  await act(() => pending['/api/users/current/organizations']());

  expect(screen.getByTestId('state').textContent).toBe('organizations: 1');
});
