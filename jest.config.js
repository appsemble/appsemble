module.exports = {
  collectCoverageFrom: ['blocks/**', 'packages/**'],
  moduleFileExtensions: ['js', 'jsx'],
  moduleNameMapper: {
    [/\.css$/.source]: 'identity-obj-proxy',
  },
  snapshotSerializers: ['enzyme-to-json/serializer'],
  setupFiles: ['<rootDir>/config/jest/setupTestFramework'],
  testURL: 'http://localhost',
};
