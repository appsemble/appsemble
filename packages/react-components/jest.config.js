module.exports = {
  clearMocks: true,
  displayName: '@appsemble/react-components',
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
  moduleNameMapper: {
    [/@appsemble\/([\w-]+)/.source]: '@appsemble/$1/src',
    [/\.css$/.source]: 'identity-obj-proxy',
  },
  preset: 'ts-jest',
  resetMocks: true,
  restoreMocks: true,
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  transform: {
    [/\/[A-Z]\w+\/messages\.ts$/.source]: 'babel-jest',
  },
};
