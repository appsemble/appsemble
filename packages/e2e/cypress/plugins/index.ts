import { addMatchImageSnapshotPlugin } from 'cypress-image-snapshot/plugin';

const Plugin: Cypress.PluginConfig = (on, config) => {
  // Tweak Cypress config
  Object.assign(config.env, process.env);
  Object.assign(config, {
    baseUrl: `https://${config.env.CI_MERGE_REQUEST_IID || 'staging'}.appsemble.review`,
  });

  addMatchImageSnapshotPlugin(on, config);

  on('before:browser:launch', (browser, launchOptions) => {
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
  });

  return config;
};

export default Plugin;
