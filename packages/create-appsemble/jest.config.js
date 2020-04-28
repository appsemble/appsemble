module.exports = {
  displayName: 'create-appsemble',
  moduleNameMapper: {
    [/@appsemble\/([\w-]+)/.source]: '@appsemble/$1/src',
  },
  preset: 'ts-jest',
  testEnvironment: 'node',
};
