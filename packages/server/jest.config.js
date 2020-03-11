module.exports = {
  coveragePathIgnorePatterns: ['__fixtures__'],
  displayName: '@appsemble/server',
  moduleNameMapper: {
    [/@appsemble\/([\w-]+)/.source]: '@appsemble/$1/src',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'node',
};
