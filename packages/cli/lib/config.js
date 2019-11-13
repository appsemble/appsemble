import { AppsembleError, logger } from '@appsemble/node-utils';
import AppDirectory from 'appdirectory';
import axios from 'axios';
import fs from 'fs-extra';
import querystring from 'querystring';

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
 * Fetch the Appsemble config file.
 *
 * @returns Appsemble config or empty object if it didn't exist
 */
export async function getConfig() {
  const filePath = getConfigPath();

  logger.verbose(`Reading config at ${filePath}`);
  try {
    const config = await fs.readJson(filePath);
    return config || {};
  } catch (err) {
    return {};
  }
}

/**
 * Save an Appsemble config file.
 *
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
 * Attempt to authenticate to an Appsemble server.
 *
 * @param {string} remote Host to authenticate at.
 * @param {string} username Username to use to authenticate with.
 * @param {string} password Password to use to authenticate with.
 *
 * @returns {AxiosResponse} Response from request.
 */
export async function requestToken(remote, username, password) {
  logger.verbose(`Requesting token at ${remote}/api/oauth/token using username ${username}`);

  return axios.post(
    '/api/oauth/token',
    querystring.stringify({
      grant_type: 'password',
      username,
      password,
      client_id: 'appsemble-studio',
      scope: 'apps:read apps:write blocks:write organizations:style',
    }),
  );
}

/**
 * Attempt to fetch a new token from the Appsemble server.
 *
 * @param {string} remote Host to fetch token from.
 * @returns {(string|null)} The token if already authenticated or null if not.
 */
export async function getToken(remote = axios.defaults.baseURL) {
  const config = await getConfig();

  if (!config[remote]) {
    logger.verbose(`Remote ${remote} does not exist in config.`);
    throw new AppsembleError('Unable to retrieve token.');
  }

  if (!config[remote].auth) {
    logger.verbose(`${remote}.auth does not exist in config.`);
    throw new AppsembleError('Unable to retrieve token.');
  }

  try {
    const { refresh_token: refreshToken } = config[remote].auth.token;
    const requestDate = new Date();
    const { data } = await axios.post(
      '/api/oauth/token',
      querystring.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: 'appsemble-studio',
        client_secret: 'appsemble-studio-secret',
      }),
    );

    await saveConfig({
      ...config,
      [remote]: {
        ...config[remote],
        auth: { requestDate, token: data },
      },
    });
    axios.defaults.headers.common.Authorization = `Bearer ${data.access_token}`;
    return data;
  } catch (e) {
    logger.verbose(e);
    throw new AppsembleError('Unable to retrieve token.');
  }
}
