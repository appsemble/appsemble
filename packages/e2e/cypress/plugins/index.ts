import { readdirSync } from 'fs';
import { join } from 'path';

import { addMatchImageSnapshotPlugin } from 'cypress-image-snapshot/plugin';

/**
 * @param on - Used to hook into various events Cypress emits.
 * @param config - The resolved Cypress config.
 * @returns The updated Cypress config.
 */
// eslint-disable-next-line import/no-default-export
export default function Plugin(
  on: Cypress.PluginEvents,
  config: Cypress.PluginConfigOptions,
): Cypress.ConfigOptions {
  const templates = readdirSync(join(__dirname, '../../../../', 'apps'));

  // Cypress uses its own separate set of environment variables.
  Object.assign(config, {
    env: { ...config.env, ...process.env, templates },
    baseUrl: `https://${
      config.env.CI_MERGE_REQUEST_IID || process.env.CI_MERGE_REQUEST_IID || 'staging'
    }.appsemble.review`,
  });

  addMatchImageSnapshotPlugin(on, config);

  on('before:browser:launch', (browser, launchOptions) => {
    if (browser.name === 'chrome') {
      launchOptions.args.push('--lang=en');
      return launchOptions;
    }
  });

  return config;
}
