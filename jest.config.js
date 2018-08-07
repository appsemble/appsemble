module.exports = {
  collectCoverageFrom: [
    'blocks/**',
    'packages/**',
    'src/**',
  ],
  moduleFileExtensions: ['mjs', 'js', 'jsx'],
  moduleNameMapper: {
    [/\.(gif|jpe?g|png|svg|yaml)$/.source]: '<rootDir>/__mocks__/fileMock.js',
    [/\.css$/.source]: 'identity-obj-proxy',
  },
  testURL: 'http://localhost',
  transform: {
    [/\.(mjs|jsx)$/.source]: '@appsemble/babel-jest',
  },
};
