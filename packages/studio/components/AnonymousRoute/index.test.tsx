import { render, screen } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, expect, it } from 'vitest';

import { AnonymousRoute } from './index.js';
import { UserProvider } from '../UserProvider/index.js';

const transport = axios.defaults.adapter;

beforeEach(() => {
  localStorage.access_token = `e30.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))}.signature`;
  localStorage.refresh_token = 'refresh';
  axios.defaults.adapter = (config) =>
    Promise.resolve({
      data: config.url === '/api/users/current' ? { sub: 'staff', email: 'staff@example.com' } : [],
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });
});

afterEach(() => {
  axios.defaults.adapter = transport;
  localStorage.clear();
});

function renderRegister(redirect: string): void {
  render(
    <MemoryRouter initialEntries={[`/register?${new URLSearchParams({ redirect })}`]}>
      <UserProvider>
        <Routes>
          <Route element={<AnonymousRoute />}>
            <Route element={<p>Register</p>} path="/register" />
          </Route>
          <Route element={<p>Apps</p>} path="/apps" />
          <Route element={<p>Docs</p>} path="/docs" />
        </Routes>
      </UserProvider>
    </MemoryRouter>,
  );
}

it.each(['https://outside.example/', '//outside.example'])(
  'should send a signed-in user to the apps page instead of the redirect %s outside Studio',
  async (redirect) => {
    renderRegister(redirect);

    expect(await screen.findByText('Apps')).toBeDefined();
  },
);

it('should send a signed-in user to a redirect within Studio', async () => {
  renderRegister('/docs');

  expect(await screen.findByText('Docs')).toBeDefined();
});
