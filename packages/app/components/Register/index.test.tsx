import { act, fireEvent, render, screen } from '@testing-library/react';
import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios';
import { Route } from 'wouter-preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Register } from './index.js';
import * as appDefinitionProvider from '../AppDefinitionProvider/index.js';
import * as appMemberProvider from '../AppMemberProvider/index.js';
import * as appMessagesProvider from '../AppMessagesProvider/index.js';
import { IntlProvider } from '../IntlProvider/index.js';
import { type RegistrationFormValues } from '../RegisterForm/index.js';

const { axiosPost } = vi.hoisted(() => ({ axiosPost: vi.fn() }));

vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();

  return { ...actual, default: { ...actual.default, post: axiosPost } };
});

vi.mock('../RegisterForm/index.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../RegisterForm/index.js')>();

  return {
    ...actual,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    RegisterForm: ({
      onRegister,
    }: {
      readonly onRegister: (values: RegistrationFormValues) => Promise<void>;
    }) => (
      <button
        onClick={() => {
          onRegister({ email: 'test@example.com', password: 'password' } as never).catch(() => {
            // Rejections are asserted through the mocks below.
          });
        }}
        type="button"
      >
        Register
      </button>
    ),
  };
});

// The app bar needs the whole app runtime around it, which has nothing to do with registering.
// eslint-disable-next-line @typescript-eslint/naming-convention
vi.mock('../TitleBar/index.js', () => ({ AppBar: () => null }));

const passwordLogin = vi.fn();

function createError(status: number, data: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() };
  const response = { config, data, headers: {}, status, statusText: '' } as AxiosResponse;
  return new AxiosError('Request failed', String(status), config as never, null, response);
}

async function submit(): Promise<void> {
  window.history.replaceState(null, '', '/en/Register');
  render(
    <IntlProvider locale="en" messages={{}}>
      <Route path="/:lang/Register">
        <Register />
      </Route>
    </IntlProvider>,
  );

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));
    await Promise.resolve();
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  passwordLogin.mockImplementation(() => Promise.resolve());
  axiosPost.mockResolvedValue({ data: {} });
  vi.spyOn(appDefinitionProvider, 'useAppDefinition').mockReturnValue({
    definition: { defaultPage: 'Home', name: 'Test App', pages: [] },
  } as never);
  vi.spyOn(appMemberProvider, 'useAppMember').mockReturnValue({ passwordLogin } as never);
  vi.spyOn(appMessagesProvider, 'useAppMessages').mockReturnValue({
    getAppMessage: ({ defaultMessage }: { defaultMessage: string }) => ({
      format: () => defaultMessage,
    }),
  } as never);
});

describe('Register', () => {
  it('should log in after registering', async () => {
    await submit();

    expect(passwordLogin).toHaveBeenCalledWith({
      username: 'test@example.com',
      password: 'password',
      redirect: undefined,
    });
  });

  it('should log in after a registration which responds with a TOTP challenge', async () => {
    axiosPost.mockRejectedValue(
      createError(401, {
        error: 'Unauthorized',
        message: 'TOTP verification required',
        statusCode: 401,
        data: { totpRequired: true, totpEnabled: false, totpToken: 'pending' },
      }),
    );

    await submit();

    // The account was created, the login below raises the same challenge where it’s handled.
    expect(passwordLogin).toHaveBeenCalledWith({
      username: 'test@example.com',
      password: 'password',
      redirect: undefined,
    });
  });

  it('should not log in if registering failed for another reason', async () => {
    axiosPost.mockRejectedValue(createError(409, { message: 'Conflict' }));

    await submit();

    expect(passwordLogin).not.toHaveBeenCalled();
  });
});
