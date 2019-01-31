module.exports = {
  collectCoverageFrom: ['app/**', 'blocks/**', 'packages/**', 'server/**'],
  moduleFileExtensions: ['js', 'jsx'],
  moduleNameMapper: {
    [/\.css$/.source]: 'identity-obj-proxy',
  },
  snapshotSerializers: ['enzyme-to-json/serializer'],
  setupFiles: ['<rootDir>/config/jest/setupTestFramework'],
  testURL: 'http://localhost',
};
