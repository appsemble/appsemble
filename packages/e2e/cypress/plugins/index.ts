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
    // eslint-disable-next-line no-console
    console.log(browser);
    if (browser.name === 'electron') {
      // eslint-disable-next-line no-param-reassign
      launchOptions.preferences = {
        ...launchOptions.preferences,
        width: 1920,
        height: 1080,
        fullscreen: true,
      };

      return launchOptions;
    }

    if (browser.name === 'chrome') {
      launchOptions.args.push(
        '--lang=en',
        '--window-size=1920,1080',
        '--force-device-scale-factor=1',
      );
      return launchOptions;
    }
  });

  return config;
}
