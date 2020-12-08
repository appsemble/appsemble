module.exports = {
  clearMocks: true,
  displayName: '@appsemble/app',
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
  moduleFileExtensions: ['js', 'ts', 'tsx', 'json'],
  moduleNameMapper: {
    [/@appsemble\/([\w-]+)/.source]: '@appsemble/$1/src',
    [/\.css$/.source]: 'identity-obj-proxy',
  },
  preset: 'ts-jest',
  resetMocks: true,
  restoreMocks: true,
  transform: {
    [/\/[A-Z]\w+\/messages\.ts$/.source]: 'babel-jest',
  },
};
