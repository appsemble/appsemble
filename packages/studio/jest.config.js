module.exports = {
  displayName: '@appsemble/studio',
  moduleNameMapper: {
    [/@appsemble\/([\w-]+)/.source]: '@appsemble/$1/src',
    [/\.css$/.source]: 'identity-obj-proxy',
  },
  preset: 'ts-jest',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  snapshotSerializers: ['enzyme-to-json/serializer'],
  transform: {
    [/\/messages\.tsx$/.source]: 'babel-jest',
  },
};
