import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import { createContext, type ReactNode, useContext, useMemo, useState } from 'react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { SettingsPage } from '../index.js';

const initialApp = {
  id: 1,
  OrganizationId: 'test',
  definition: { name: 'Test app' },
  path: 'test-app',
  visibility: 'unlisted',
  locked: 'unlocked',
  iconBackground: '#ffffff',
  supportedLanguages: ['en'],
  passwordProtected: false,
  passwordToken: undefined as string | undefined,
};
const AppContext = createContext<{
  app: typeof initialApp;
  setApp: (app: typeof initialApp) => void;
}>({
  app: initialApp,
  setApp: vi.fn<(app: typeof initialApp) => void>(),
});
const transport = axios.defaults.adapter;
let submittedPasswords: (FormDataEntryValue | null)[];

vi.mock('../../index.js', () => ({ useApp: () => useContext(AppContext) }));
vi.mock('../../../../../components/UserProvider/index.js', () => ({
  useUser: () => ({ organizations: [{ id: 'test' }] }),
}));

beforeEach(() => {
  submittedPasswords = [];
  axios.defaults.adapter = (config) => {
    let data: unknown = [];
    if (config.method === 'patch') {
      const password = (config.data as FormData).get('password');
      submittedPasswords.push(password);
      data = {
        ...initialApp,
        passwordProtected: true,
        passwordToken: 'saved-password-token',
      };
    }
    return Promise.resolve({ data, status: 200, statusText: 'OK', headers: {}, config });
  };
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
});

afterEach(() => {
  axios.defaults.adapter = transport;
});

function TestApp(): ReactNode {
  const [app, setApp] = useState(initialApp);
  const context = useMemo(() => ({ app, setApp }), [app]);
  return (
    <AppContext.Provider value={context}>
      <SettingsPage />
    </AppContext.Provider>
  );
}

function renderSettings(): void {
  render(
    <IntlProvider locale="en" messages={{}}>
      <MemoryRouter>
        <TestApp />
      </MemoryRouter>
    </IntlProvider>,
  );
}

it('should require a password before saving newly enabled password protection', async () => {
  renderSettings();
  fireEvent.click(screen.getByLabelText('Password protection'));
  expect(screen.getByRole('button', { name: 'Save changes' })).toHaveProperty('disabled', true);

  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'open sesame' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

  await waitFor(() => expect(submittedPasswords).toStrictEqual(['open sesame']));
});

it('should allow saving after turning password protection on and off without a password', async () => {
  renderSettings();
  fireEvent.click(screen.getByLabelText('Password protection'));
  fireEvent.click(screen.getByLabelText('Password protection'));
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

  await waitFor(() => expect(submittedPasswords).toStrictEqual(['']));
});

it('should keep the saved password when other settings are saved afterwards', async () => {
  renderSettings();
  fireEvent.click(screen.getByLabelText('Password protection'));
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'open sesame' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  await screen.findByLabelText('Password(Optional)');

  fireEvent.click(screen.getByLabelText('Show app definition'));
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

  await waitFor(() => expect(submittedPasswords).toStrictEqual(['open sesame', null]));
});
