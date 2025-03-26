import { AppsembleError, logger } from '@appsemble/node-utils';
import { type TokenResponse } from '@appsemble/types';
import axios, { type AxiosHeaders } from 'axios';
import inquirer from 'inquirer';

export const CREDENTIALS_ENV_VAR = 'APPSEMBLE_CLIENT_CREDENTIALS';

const authorizedRemotes = new Set<string>();

export function getService(remote: string): string {
  return `appsemble://${new URL(remote).host}`;
}

export async function getKeytar(): Promise<typeof import('keytar')> {
  try {
    const { default: keytar } = await import('keytar');
    return keytar;
  } catch {
    throw new AppsembleError(
      'Couldn’t find module keytar. Either install libsecret and reinstall @appsemble/cli, or pass --client-credentials on the command line.',
    );
  }
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

  const { findCredentials } = await getKeytar();
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
    ({ choice } = await inquirer.prompt([
      {
        name: 'choice',
        message: 'Select client id to use',
        choices: choices.map((value) => ({ name: value.account, value })),
        type: 'list',
      },
    ]));
  }
  return `${choice.account}:${choice.password}`;
}

/**
 * Login to the server using OAuth2 client credentials.
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
  if (authorizedRemotes.has(remote)) {
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
  authorizedRemotes.add(remote);
  axios.interceptors.request.use((config) => {
    if (config.baseURL === remote) {
      (config.headers as AxiosHeaders).set('authorization', `Bearer ${data.access_token}`);
    }
    return config;
  });
  logger.info(`Logged in to ${remote} successfully`);
  logger.verbose(`Login scope: ${scope}`);
}
