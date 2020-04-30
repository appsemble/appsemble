module.exports = {
  coveragePathIgnorePatterns: ['.d.ts$'],
  displayName: '@appsemble/node-utils',
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
  preset: 'ts-jest',
  testEnvironment: 'node',
};
