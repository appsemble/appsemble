import { AppsembleError, logger } from '@appsemble/node-utils';
import axios from 'axios';
import inquirer from 'inquirer';
import { URL, URLSearchParams } from 'url';

import type { BaseArguments } from '../types';

export const CREDENTIALS_ENV_VAR = 'APPSEMBLE_CLIENT_CREDENTIALS';

function validate(credentials: string): boolean {
  return /.+:.+/.test(credentials);
}

function getService(remote: string): string {
  return `appsemble://${new URL(remote).host}`;
}

async function getKeytar(): Promise<typeof import('keytar')> {
  try {
    return await import('keytar');
  } catch (error) {
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
      `No client credentials found. Register them using:\n\nappsemble auth login --remote ${remote}`,
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

export async function login({ clientCredentials, remote }: BaseArguments): Promise<void> {
  const { setPassword } = await getKeytar();
  let credentials = clientCredentials;
  if (credentials) {
    if (!validate(clientCredentials)) {
      throw new AppsembleError(
        `Invalid client credentials. Client credentials can be registered on ${remote}/settings/client-credentials`,
      );
    }
    credentials = clientCredentials;
  } else {
    ({ credentials } = await inquirer.prompt([
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
  logger.info(`Succesfully stored credentials for ${clientId} 🕶`);
}

export async function remove({ remote }: BaseArguments): Promise<void> {
  const { deletePassword, findCredentials } = await getKeytar();
  const choices = await findCredentials(getService(remote));
  if (choices.length === 0) {
    logger.warn('No client credentials are currently in use.');
    return;
  }
  const { clientIds } = await inquirer.prompt<{ clientIds: string[] }>([
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
      logger.info(`Succesfully delete client id ${clientId}`);
    }),
  );
}

/**
 * Login to the server using OAuth2 client credentials.
 *
 * @param {string} remote Host to fetch token from.
 * @param {string} scope The OAuth2 scope to request. This may be space separated to request
 * multiple scopes.
 * @param {string} inputCredentials Client credentials passed from the command line.
 */
export async function authenticate(
  remote = axios.defaults.baseURL,
  scope: string,
  inputCredentials: string,
): Promise<void> {
  const credentials = await getClientCredentials(remote, inputCredentials);
  logger.verbose(`Logging in to ${remote}`);
  const { data } = await axios.post(
    '/oauth2/token',
    new URLSearchParams({ grant_type: 'client_credentials', scope }),
    { headers: { authorization: `Basic ${Buffer.from(credentials).toString('base64')}` } },
  );
  axios.defaults.headers.common.authorization = `Bearer ${data.access_token}`;
  logger.info('Logged in succesfully');
  logger.verbose(`Login scope: ${scope}`);
}
