/**
 * Configure Cypress.
 *
 * @param on - Used to hook into various events Cypress emits.
 * @param config - The resolved Cypress config.
 * @returns The updated Cypress config.
 */
const Plugin: Cypress.PluginConfig = (on, config) => {
  // Tweak Cypress config
  Object.assign(config.env, process.env);
  Object.assign(config, {
    baseUrl: `https://${config.env.CI_MERGE_REQUEST_IID || 'staging'}.appsemble.review`,
  });

  return config;
};

// eslint-disable-next-line import/no-default-export
export default Plugin;
