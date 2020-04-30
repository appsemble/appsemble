module.exports = {
  displayName: '@appsemble/preact',
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
  snapshotSerializers: ['enzyme-to-json/serializer'],
  preset: 'ts-jest',
};
