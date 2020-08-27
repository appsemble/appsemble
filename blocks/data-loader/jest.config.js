module.exports = {
  clearMocks: true,
  displayName: '@appsemble/data-loader',
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
