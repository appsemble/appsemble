module.exports = {
  coveragePathIgnorePatterns: ['.d.ts$'],
  displayName: '@appsemble/node-utils',
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
  moduleNameMapper: {
    [/@appsemble\/([\w-]+)/.source]: '@appsemble/$1/src',
  },
  preset: 'ts-jest',
  resetMocks: true,
  testEnvironment: 'node',
};
