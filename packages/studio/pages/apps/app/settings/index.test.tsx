import { render, screen, within } from '@testing-library/react';
import axios from 'axios';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { SettingsPage } from './index.js';

const app = {
  id: 1,
  OrganizationId: 'test',
  definition: { name: 'Test app' },
  path: 'test-app',
  locked: 'unlocked',
  supportedLanguages: ['en'],
};
const transport = axios.defaults.adapter;

vi.mock('../index.js', () => ({ useApp: () => ({ app, setApp: vi.fn() }) }));
vi.mock('../../../../components/UserProvider/index.js', () => ({
  useUser: () => ({ organizations: [{ id: 'test' }] }),
}));

beforeEach(() => {
  axios.defaults.adapter = (config) =>
    Promise.resolve({
      data: config.url === '/api/apps/1/messages' ? ['ang', 'en'] : [],
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });
});

afterEach(() => {
  axios.defaults.adapter = transport;
});

it('should offer every translated language as a supported language', async () => {
  render(
    <IntlProvider locale="en" messages={{}}>
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    </IntlProvider>,
  );

  const options = await within(
    screen.getByLabelText('Supported languages(Optional)'),
  ).findAllByRole('option');
  expect(options.map((option) => option.textContent)).toStrictEqual(['Old English', 'English']);
});
