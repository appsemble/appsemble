/** @type {import('jest').Config} */
export default {
  projects: ['<rootDir>/blocks/*', '<rootDir>/packages/*'],
  collectCoverageFrom: ['**/*.{ts,tsx}'],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  reporters: ['default', 'jest-junit', 'jest-image-snapshot/src/outdated-snapshot-reporter.js'],
  coverageProvider: 'v8',
  coverageReporters: ['cobertura', 'json', 'lcov', 'text'],
};
