module.exports = {
  collectCoverageFrom: ['blocks/**', 'packages/**', 'api/**', 'app/**'],
  moduleFileExtensions: ['js', 'jsx'],
  moduleNameMapper: {
    [/\.css$/.source]: 'identity-obj-proxy',
  },
  snapshotSerializers: ['enzyme-to-json/serializer'],
  setupTestFrameworkScriptFile: '<rootDir>/config/jest/setupTestFramework',
  testURL: 'http://localhost',
};
