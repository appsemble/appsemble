module.exports = {
  displayName: '@appsemble/app',
  moduleFileExtensions: ['js', 'ts', 'tsx', 'json'],
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
