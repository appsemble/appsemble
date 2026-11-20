import { AppsembleError, logger } from '@appsemble/node-utils';
import { type TokenResponse } from '@appsemble/types';
import { select } from '@inquirer/prompts';
import axios, { type AxiosHeaders } from 'axios';

export const CREDENTIALS_ENV_VAR = 'APPSEMBLE_CLIENT_CREDENTIALS';

/**
 * The client credentials and access token of the login to each remote URL.
 */
const logins = new Map<string, { credentials: string; accessToken: string }>();

export function getService(remote: string): string {
  return `appsemble://${new URL(remote).host}`;
}

export interface Keyring {
  findCredentials: (service: string) => Promise<{ account: string; password: string }[]>;
  setPassword: (service: string, account: string, password: string) => Promise<void>;
  deletePassword: (service: string, account: string) => Promise<void>;
}

async function importKeyring(): Promise<typeof import('@napi-rs/keyring')> {
  try {
    return await import('@napi-rs/keyring');
  } catch {
    throw new AppsembleError(
      'Couldn’t access the system keyring. Reinstall @appsemble/cli, or pass --client-credentials on the command line.',
    );
  }
}

export async function getKeyring(): Promise<Keyring> {
  const { AsyncEntry, findCredentialsAsync } = await importKeyring();
  return {
    findCredentials: (service) => findCredentialsAsync(service),
    setPassword: (service, account, password) =>
      new AsyncEntry(service, account).setPassword(password),
    async deletePassword(service, account) {
      await new AsyncEntry(service, account).deletePassword();
    },
  };
}

async function getClientCredentials(remote: string, inputCredentials?: string): Promise<string> {
  if (inputCredentials) {
    return inputCredentials;
  }

  const envCredentials = process.env[CREDENTIALS_ENV_VAR];
  if (envCredentials) {
    logger.info(`Detected client credentials from ${CREDENTIALS_ENV_VAR} environment variable`);
    return envCredentials;
  }

  const { findCredentials } = await getKeyring();
  const choices = await findCredentials(getService(remote));
  if (choices.length === 0) {
    throw new AppsembleError(
      `No client credentials found. Register them using:\n\nappsemble login --remote ${remote}`,
    );
  }
  let choice;
  if (choices.length === 1) {
    [choice] = choices;
  } else {
    choice = await select({
      message: 'Select client id to use',
      choices: choices.map((value) => ({ name: value.account, value })),
    });
  }
  return `${choice.account}:${choice.password}`;
}

/**
 * Login to the server using OAuth2 client credentials.
 *
 * Requests to the remote carry the access token of the latest login. A login with the same client
 * credentials is reused, a login with other client credentials replaces it.
 *
 * @param remote Host to fetch token from.
 * @param scope The OAuth2 scope to request. This may be space separated to request
 *   multiple scopes.
 * @param inputCredentials Client credentials passed from the command line.
 */
export async function authenticate(
  remote: string,
  scope: string,
  inputCredentials?: string,
): Promise<void> {
  const credentials = await getClientCredentials(remote, inputCredentials);
  const login = logins.get(remote);
  if (login?.credentials === credentials) {
    logger.verbose(`Already logged in to ${remote}`);
    return;
  }
  logger.verbose(`Logging in to ${remote}`);
  const { data } = await axios.post<TokenResponse>(
    '/auth/oauth2/token',
    new URLSearchParams({ grant_type: 'client_credentials', scope }),
    {
      headers: { authorization: `Basic ${Buffer.from(credentials).toString('base64')}` },
      baseURL: remote,
    },
  );
  if (!login) {
    axios.interceptors.request.use((config) => {
      if (config.baseURL === remote) {
        // A request that brings its own authorization, such as a login, keeps it.
        (config.headers as AxiosHeaders).set(
          'authorization',
          `Bearer ${logins.get(remote)!.accessToken}`,
          false,
        );
      }
      return config;
    });
  }
  logins.set(remote, { credentials, accessToken: data.access_token });
  logger.info(`Logged in to ${remote} successfully`);
  logger.verbose(`Login scope: ${scope}`);
}
