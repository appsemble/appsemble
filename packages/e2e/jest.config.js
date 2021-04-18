const createConfig = require('../../config/jest/config');

/**
 * This is a stub config.
 *
 * Each project in the Appsemble repository needs a jest configuration, but for end to end tests we
 * use a different setup.
 */
module.exports = {
  ...createConfig(__dirname),
  testPathIgnorePatterns: ['<rootDir>/src/'],
};
