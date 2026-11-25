import { render, screen } from '@testing-library/react';
import axios, { AxiosError } from 'axios';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it } from 'vitest';

import { VerifyPage } from './index.js';
import { UserProvider } from '../../components/UserProvider/index.js';

const transport = axios.defaults.adapter;

beforeEach(() => {
  localStorage.clear();
  axios.defaults.adapter = (config) => {
    const response = { data: {}, status: 200, statusText: 'OK', headers: {}, config };
    if (config.url === '/api/auth/email/verify') {
      return Promise.resolve(response);
    }
    return Promise.reject(
      new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, {
        ...response,
        status: 401,
      }),
    );
  };
});

afterEach(() => {
  axios.defaults.adapter = transport;
});

it('should tell a signed-out user that their email was verified', async () => {
  render(
    <IntlProvider locale="en" messages={{}}>
      <MemoryRouter initialEntries={['/en/verify?token=verification-token']}>
        <UserProvider>
          <VerifyPage />
        </UserProvider>
      </MemoryRouter>
    </IntlProvider>,
  );

  expect(await screen.findByText(/Your email was successfully verified!/)).toBeDefined();
});
