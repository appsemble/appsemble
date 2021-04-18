module.exports = {
  projects: ['<rootDir>/blocks/*', '<rootDir>/packages/*', '!<rootDir/packages/e2e>'],
  collectCoverageFrom: ['**/src/**/*.{ts,tsx}'],
  reporters: ['default', 'jest-junit', 'jest-image-snapshot/src/outdated-snapshot-reporter.js'],
  coverageReporters: ['cobertura', 'json', 'lcov', 'text'],
};
