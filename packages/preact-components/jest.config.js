module.exports = {
  displayName: '@appsemble/preact-components',
  moduleNameMapper: {
    [/@appsemble\/([\w-]+)/.source]: '@appsemble/$1/src',
    [/\.css$/.source]: 'identity-obj-proxy',
  },
  preset: 'ts-jest',
  snapshotSerializers: ['enzyme-to-json/serializer'],
};
