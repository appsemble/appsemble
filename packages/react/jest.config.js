module.exports = {
  displayName: '@appsemble/react',
  moduleNameMapper: {
    '@appsemble/sdk': '@appsemble/sdk/src',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  snapshotSerializers: ['enzyme-to-json/serializer'],
};
