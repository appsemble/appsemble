module.exports = {
  collectCoverageFrom: ['blocks/**', 'packages/**', 'api/**', 'app/**'],
  moduleFileExtensions: ['js', 'jsx'],
  moduleNameMapper: {
    [/\.(gif|jpe?g|png|svg|yaml)$/.source]: '<rootDir>/__mocks__/fileMock.js',
    [/\.css$/.source]: 'identity-obj-proxy',
  },
  testURL: 'http://localhost',
};
