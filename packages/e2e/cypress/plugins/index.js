module.exports = (on, config) => {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config
  const newConfig = { ...config };
  const baseUrl = `https://${process.env.CI_MERGE_REQUEST_IID || 'staging'}.appsemble.review`;

  // Cypress uses its own separate set of environment variables.
  newConfig.env = { ...config.env, ...process.env };
  newConfig.baseUrl = baseUrl;

  return newConfig;
};
