const createConfig = require('../../config/jest/config');

/**
 * Because only one preset can be used and we’re already using the `ts-jest` preset, the
 * `jest-puppeteer` preset can’t be used here.
 *
 * This setup is based on
 * https://github.com/smooth-code/jest-puppeteer/blob/v5.0.1/packages/jest-puppeteer/jest-preset.js
 */
module.exports = {
  ...createConfig(__dirname),
  globalSetup: 'jest-environment-puppeteer/setup',
  globalTeardown: 'jest-environment-puppeteer/teardown',
  testEnvironment: 'jest-environment-puppeteer',
};
