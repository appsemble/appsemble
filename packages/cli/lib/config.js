import querystring from 'querystring';

import { AppsembleError, logger } from '@appsemble/node-utils';
import axios from 'axios';
import AppDirectory from 'appdirectory';
import fs from 'fs-extra';

function getAppDirectory() {
  return new AppDirectory({
    appName: 'appsemble',
    appAuthor: 'appsemble',
  });
}

function getConfigPath() {
  return `${getAppDirectory().userConfig()}/config.json`;
}

/**
 * Fetches the Appsemble config file.
 *
 * @param {Object} options
 * @param {boolean} throws Whether exceptions should be thrown if the file doesn't exist or doesn't parse correctly. Will create directories if set to false.
 * @return Appsemble config or empty object if it didn't exist
 */
export async function getConfig(options = { throws: false }) {
  const { throws } = options;
  const filePath = getConfigPath();

  logger.verbose(`Reading config at ${filePath}`);

  if (!throws) {
    await fs.ensureFile(filePath);
  }

  return fs.readJson(filePath, { throws }) || {};
}

/**
 * Saves an Appsemble config file.
 * Will create directories if necessary.
 *
 * @param {Object} config Config to save
 */
export async function saveConfig(config) {
  const filePath = getConfigPath();
  logger.verbose(`Writing config to ${filePath}`);
  logger.silly(`Config: ${JSON.stringify(config)}`);

  return fs.outputJson(filePath, config);
}

/**
 * Attempts to authenticate to an Appsemble server.
 *
 * @param {string} remote Host to authenticate at.
 * @param {string} username Username to use to authenticate with.
 * @param {string} password Password to use to authenticate with.
 *
 * @return {import('axios').AxiosResponse} Response from request.
 */
export async function requestToken(remote, username, password) {
  logger.verbose(
    `Requesting token at ${remote}/api/oauth/token using username ${username} and password ${new Array(
      password.length + 1,
    ).join('*')}`,
  );

  return axios.post(
    '/api/oauth/token',
    querystring.stringify({
      grant_type: 'password',
      username,
      password,
      client_id: 'appsemble-editor',
      scope: 'apps:read apps:write',
    }),
  );
}

/**
 * Attempts to fetch a new token from the Appsemble server.
 *
 * @param {string} remote Host to fetch token from.
 * @return {(string|null)} The token if already authenticated or null if not.
 */
export async function getToken(remote) {
  const config = await getConfig();

  if (!config[remote]) {
    logger.verbose(`Remote ${remote} does not exist in config.`);
    return null;
  }

  if (!config[remote].auth) {
    logger.verbose(`${remote}.auth does not exist in config.`);
    return null;
  }

  try {
    const { refresh_token: refreshToken } = config[remote].auth.token;
    const response = await axios.post(
      '/api/oauth/token',
      querystring.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: 'appsemble-editor',
        client_secret: 'appsemble-editor-secret',
      }),
    );

    return response.data;
  } catch (e) {
    if (e.response) {
      return null;
    }

    throw new AppsembleError('Unable to retrieve token.');
  }
}

/**
 * Checks against axios headers to determine whether the CLI is authenticated or not.
 *
 * @return true if authenticated, otherwise false.
 */
export function isAuthenticated() {
  return !!axios.defaults.headers.common.Authorization;
}
