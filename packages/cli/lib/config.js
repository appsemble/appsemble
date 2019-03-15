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
  return fs.outputJson(filePath, config);
}
