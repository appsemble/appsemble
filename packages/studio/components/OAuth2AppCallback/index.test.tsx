import { render } from '@testing-library/react';
import axios, { AxiosError } from 'axios';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { OAuth2AppCallback } from './index.js';

const transport = axios.defaults.adapter;
let originalLocation: Location;

beforeEach(() => {
  originalLocation = window.location;
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: { assign: vi.fn() },
  });
});

afterEach(() => {
  axios.defaults.adapter = transport;
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: originalLocation,
    writable: true,
  });
});

it.each([
  {
    status: 403,
    data: { error: 'access_denied', error_description: 'noRoleMatch' },
    query: 'error=access_denied&error_description=noRoleMatch',
  },
  { status: 400, data: undefined, query: 'error=invalid_request' },
  { status: 502, data: undefined, query: 'error=server_error' },
])(
  'should pass a failed login to the app as an OAuth2 error ($status)',
  async ({ data, query, status }) => {
    axios.defaults.adapter = (config) =>
      Promise.reject(
        new AxiosError('Login failed', 'ERR_BAD_RESPONSE', config, undefined, {
          config,
          data: { statusCode: status, data },
          headers: {},
          status,
          statusText: '',
        }),
      );

    render(
      <MemoryRouter initialEntries={['/callback?code=provider-code&state=studio-state']}>
        <OAuth2AppCallback
          session={{
            appRequest: String(
              new URLSearchParams({
                client_id: 'app:42',
                redirect_uri: 'https://app.example/Callback',
                scope: 'email openid',
                state: 'app-state',
              }),
            ),
            authorizationUrl: 'https://idp.example/authorize',
            id: '7',
            redirect: '',
            state: 'studio-state',
          }}
        />
      </MemoryRouter>,
    );

    await vi.waitFor(() => {
      expect(window.location.assign).toHaveBeenCalledWith(
        `https://app.example/Callback?${query}&state=app-state`,
      );
    });
  },
);
