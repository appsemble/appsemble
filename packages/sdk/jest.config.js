module.exports = {
  displayName: '@appsemble/sdk',
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
  moduleNameMapper: {
    [/@appsemble\/([\w-]+)/.source]: '@appsemble/$1/src',
  },
  preset: 'ts-jest',
};
