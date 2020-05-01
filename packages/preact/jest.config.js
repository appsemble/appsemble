module.exports = {
  displayName: '@appsemble/preact',
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
  moduleNameMapper: {
    [/@appsemble\/([\w-]+)/.source]: '@appsemble/$1/src',
  },
  snapshotSerializers: ['enzyme-to-json/serializer'],
  preset: 'ts-jest',
};
