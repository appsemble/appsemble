import { type LoginFormValues } from '@appsemble/react-components';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MainLogin } from './index.js';
import * as appDefinitionProvider from '../AppDefinitionProvider/index.js';
import * as appMemberProvider from '../AppMemberProvider/index.js';

const passwordLogin = vi.fn();

vi.mock('../../utils/settings.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../utils/settings.js')>();

  return {
    ...actual,
    enableSelfRegistration: true,
    logins: [],
    showAppsembleLogin: true,
    showAppsembleOAuth2Login: false,
  };
});

vi.mock('@appsemble/react-components', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@appsemble/react-components')>();

  return {
    ...actual,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Login: ({
      onPasswordLogin,
    }: {
      readonly onPasswordLogin: (credentials: LoginFormValues) => Promise<void>;
    }) => (
      <button
        onClick={async () => {
          await onPasswordLogin({
            email: 'test@example.com',
            password: 'password',
          });
        }}
        type="button"
      >
        Login
      </button>
    ),
    useMessages: () => vi.fn(),
  };
});

beforeEach(() => {
  vi.clearAllMocks();

  vi.spyOn(appDefinitionProvider, 'useAppDefinition').mockReturnValue({
    definition: {
      defaultPage: 'Home',
      name: 'Test App',
      pages: [{ name: 'Home', blocks: [] }],
      security: {
        default: {
          policy: 'everyone',
          role: 'User',
        },
        roles: {
          User: {},
        },
      },
    },
  } as never);
  vi.spyOn(appMemberProvider, 'useAppMember').mockReturnValue({
    cancelTotpLogin: vi.fn(),
    logout: vi.fn(),
    passwordLogin,
    totpLogin: vi.fn(),
    totpPending: null,
  } as never);
});

describe('MainLogin', () => {
  it('should redirect after successful password login', async () => {
    render(
      <IntlProvider locale="en" messages={{}}>
        <MemoryRouter initialEntries={['/en/Login?redirect=%2Fen%2Ftraining-details%2F168']}>
          <Routes>
            <Route element={<MainLogin />} path="/:lang/Login" />
          </Routes>
        </MemoryRouter>
      </IntlProvider>,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Login' }));
      await Promise.resolve();
    });

    expect(passwordLogin).toHaveBeenCalledWith({
      username: 'test@example.com',
      password: 'password',
      redirect: '/en/training-details/168',
    });
  });
});
