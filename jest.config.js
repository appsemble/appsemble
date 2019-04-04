module.exports = {
  collectCoverageFrom: ['blocks/**', 'packages/**'],
  coveragePathIgnorePatterns: [/\.json$/.source, /\/dist\//.source],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  moduleNameMapper: {
    [/\.css$/.source]: 'identity-obj-proxy',
  },
  snapshotSerializers: ['enzyme-to-json/serializer'],
  setupFiles: ['<rootDir>/config/jest/setupTestFramework'],
  testURL: 'http://localhost',
};
