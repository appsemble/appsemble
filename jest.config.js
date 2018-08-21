module.exports = {
  collectCoverageFrom: [
    'blocks/**',
    'packages/**',
    'app/**',
  ],
  moduleFileExtensions: ['js', 'jsx'],
  moduleNameMapper: {
    [/\.(gif|jpe?g|png|svg|yaml)$/.source]: '<rootDir>/__mocks__/fileMock.js',
    [/\.css$/.source]: 'identity-obj-proxy',
  },
  testURL: 'http://localhost',
  transform: {
    [/\.jsx?$/.source]: '@appsemble/babel-jest',
  },
};
