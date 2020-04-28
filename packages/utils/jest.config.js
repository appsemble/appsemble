module.exports = {
  coveragePathIgnorePatterns: ['.d.ts$'],
  displayName: '@appsemble/utils',
  moduleNameMapper: {
    [/@appsemble\/([\w-]+)/.source]: '@appsemble/$1/src',
    [/\.css$/.source]: 'identity-obj-proxy',
  },
  preset: 'ts-jest',
};
