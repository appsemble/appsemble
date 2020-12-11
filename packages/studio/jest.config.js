module.exports = {
  clearMocks: true,
  displayName: '@appsemble/studio',
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
  moduleNameMapper: {
    [/@appsemble\/([\w-]+)/.source]: '@appsemble/$1/src',
    '@creativebulma/bulma-tagsinput$': '@creativebulma/bulma-tagsinput/dist/js/bulma-tagsinput.js',
    [/\.css$/.source]: 'identity-obj-proxy',
  },
  preset: 'ts-jest',
  resetMocks: true,
  restoreMocks: true,
  transform: {
    [/\/[A-Z]\w+\/messages\.ts$/.source]: 'babel-jest',
  },
};
