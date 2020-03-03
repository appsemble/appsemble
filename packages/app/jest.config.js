module.exports = {
  displayName: '@appsemble/app',
  moduleFileExtensions: ['js', 'ts', 'tsx', 'json'],
  moduleNameMapper: {
    [/\.css$/.source]: 'identity-obj-proxy',
    '@appsemble/sdk': '@appsemble/sdk/src',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  snapshotSerializers: ['enzyme-to-json/serializer'],
};
