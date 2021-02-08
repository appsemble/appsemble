module.exports = {
  projects: ['<rootDir>/blocks/*', '<rootDir>/packages/*'],
  collectCoverageFrom: ['**/src/**/*.{ts,tsx}'],
  reporters: ['default', 'jest-image-snapshot/src/outdated-snapshot-reporter.js'],
};
