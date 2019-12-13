module.exports = {
  collectCoverageFrom: ['blocks/**', 'packages/**'],
  coveragePathIgnorePatterns: [/\.json$/, /\/__fixtures__\//, /\/__snapshots__\//, /\/dist\//].map(
    regex => regex.source,
  ),
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  moduleNameMapper: {
    [/\.css$/.source]: 'identity-obj-proxy',
  },
  restoreMocks: true,
  snapshotSerializers: ['enzyme-to-json/serializer'],
  setupFilesAfterEnv: ['<rootDir>/packages/jest-config/setupFilesAfterEnv.ts'],
  testURL: 'http://localhost',
};
