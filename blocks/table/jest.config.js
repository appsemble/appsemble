module.exports = {
  clearMocks: true,
  displayName: '@appsemble/table',
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
  restoreMocks: true,
};
