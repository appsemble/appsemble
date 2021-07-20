/**
 * @param {Object} on - Used to hook into various events Cypress emits.
 * @param {Object} config - The resolved Cypress config.
 * @returns {Object} The updated Cypress config.
module.exports = (on, config) => {
  const newConfig = { ...config };
  const baseUrl = `https://${process.env.CI_MERGE_REQUEST_IID || 'staging'}.appsemble.review`;

  // Cypress uses its own separate set of environment variables.
  newConfig.env = { ...config.env, ...process.env };
  newConfig.baseUrl = baseUrl;

  return newConfig;
};
