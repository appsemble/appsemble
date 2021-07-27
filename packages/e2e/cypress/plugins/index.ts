/**
 * Configure Cypress.
 *
 * @param on - Used to hook into various events Cypress emits.
 * @param config - The resolved Cypress config.
 * @returns The updated Cypress config.
 */
// eslint-disable-next-line import/no-default-export
export default function Plugin(
  on: Cypress.PluginEvents,
  config: Cypress.PluginConfigOptions,
): Cypress.ConfigOptions {
  // Tweak Cypress config
  Object.assign(config.env, process.env);
  Object.assign(config, {
    baseUrl: `https://${config.env.CI_MERGE_REQUEST_IID || 'staging'}.appsemble.review`,
  });

  return config;
}
