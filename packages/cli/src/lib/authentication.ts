import { AppsembleError, logger } from '@appsemble/node-utils';
import { TokenResponse } from '@appsemble/types';
import axios from 'axios';
import { prompt } from 'inquirer';

import { BaseArguments } from '../types';

export const CREDENTIALS_ENV_VAR = 'APPSEMBLE_CLIENT_CREDENTIALS';

const authorizedRemotes = new Set<string>();

function validate(credentials: string): boolean {
  return /.+:.+/.test(credentials);
}

function getService(remote: string): string {
  return `appsemble://${new URL(remote).host}`;
}

async function getKeytar(): Promise<typeof import('keytar')> {
  try {
    return await import('keytar');
  } catch {
    throw new AppsembleError(
      'Couldn’t find module keytar. Either install libsecret and reinstall @appsemble/cli, or pass --client-credentials on the command line.',
    );
  }
}

async function getClientCredentials(remote: string, inputCredentials: string): Promise<string> {
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
    ({ choice } = await prompt([
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

export async function login({ clientCredentials, remote }: BaseArguments): Promise<void> {
  const { setPassword } = await getKeytar();
  const url = new URL('/settings/client-credentials', remote);
  let credentials = clientCredentials;
  if (credentials) {
    if (!validate(clientCredentials)) {
      throw new AppsembleError(
        `Invalid client credentials. Client credentials can be registered on ${url}`,
      );
    }
    credentials = clientCredentials;
  } else {
    logger.info(`Client credentials can be registered on ${url}`);
    ({ credentials } = await prompt([
      {
        name: 'credentials',
        type: 'password',
        message: 'Enter client credentials',
        validate,
      },
    ]));
  }
  const [clientId, clientSecret] = credentials.split(':');
  await setPassword(getService(remote), clientId, clientSecret);
  logger.info(`Successfully stored credentials for ${clientId} 🕶`);
}

export async function remove({ remote }: BaseArguments): Promise<void> {
  const { deletePassword, findCredentials } = await getKeytar();
  const choices = await findCredentials(getService(remote));
  if (choices.length === 0) {
    logger.warn('No client credentials are currently in use.');
    return;
  }
  const { clientIds } = await prompt<{ clientIds: string[] }>([
    {
      name: 'clientIds',
      message: 'Select client ids to delete',
      choices: choices.map(({ account }) => account),
      type: 'checkbox',
    },
  ]);
  await Promise.all(
    clientIds.map(async (clientId) => {
      await deletePassword(getService(remote), clientId);
      logger.info(`Successfully delete client id ${clientId}`);
    }),
  );
}

/**
 * Login to the server using OAuth2 client credentials.
 *
 * @param remote - Host to fetch token from.
 * @param scope - The OAuth2 scope to request. This may be space separated to request
 * multiple scopes.
 * @param inputCredentials - Client credentials passed from the command line.
 */
export async function authenticate(
  remote: string,
  scope: string,
  inputCredentials: string,
): Promise<void> {
  const credentials = await getClientCredentials(remote, inputCredentials);
  if (authorizedRemotes.has(remote)) {
    logger.verbose(`Already logged in to ${remote}`);
    return;
  }
  logger.verbose(`Logging in to ${remote}`);
  const { data } = await axios.post<TokenResponse>(
    '/oauth2/token',
    new URLSearchParams({ grant_type: 'client_credentials', scope }),
    {
      headers: { authorization: `Basic ${Buffer.from(credentials).toString('base64')}` },
      baseURL: remote,
    },
  );
  authorizedRemotes.add(remote);
  axios.interceptors.request.use((config) => {
    if (config.baseURL === remote) {
      return {
        ...config,
        headers: { authorization: `Bearer ${data.access_token}`, ...config.headers },
      };
    }
    return config;
  });
  logger.info(`Logged in to ${remote} successfully`);
  logger.verbose(`Login scope: ${scope}`);
}
