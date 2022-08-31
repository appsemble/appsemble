import { existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';

/**
 * Generate a proper Jest configuration based on a project context.
 *
 * @param {ImportMeta} meta The import module meta object.
 * @returns {import('jest').Config} A jest configuration for the project.
 */
export function createJestConfig({ url }) {
  const readJSON = (path) => JSON.parse(readFileSync(new URL(path, url)));

  const pkg = readJSON('package.json');
  const dependencies = { ...pkg.devDependencies, ...pkg.dependencies, ...pkg.peerDependencies };
  const { compilerOptions: { lib = [], types = [] } = {} } = readJSON('tsconfig.json');

  const setupFilesAfterEnv = [];
  const snapshotSerializers = [];
  const moduleNameMapper = { [/(.+)\.js$/.source]: ['$1.js', '$1.ts', '$1.tsx'] };
  const transform = {};

  // Mock CSS modules if they are enabled in the project types.
  if (types.includes('css-modules') || types.includes('@appsemble/webpack-config/types')) {
    moduleNameMapper[/\.css$/.source] = 'identity-obj-proxy';
  }

  // Load jest.setup.ts if it exists, otherwise skip it.
  const setup = new URL('jest.setup.ts', url);
  if (existsSync(setup)) {
    setupFilesAfterEnv.push(fileURLToPath(setup));
  }

  // If the types define testing library, add it to the setup files
  if (types.includes('@testing-library/jest-dom')) {
    setupFilesAfterEnv.push('@testing-library/jest-dom');
  }

  // Handle messages.ts files using Babel if babel-plugin-react-intl-auto is enabled.
  if (types.includes('babel-plugin-react-intl-auto')) {
    transform[/\/[A-Z]\w+\/messages\.ts$/.source] = 'babel-jest';
  }

  if ('jest-axios-snapshot' in dependencies) {
    snapshotSerializers.push('jest-axios-snapshot');
  }

  return {
    coveragePathIgnorePatterns: ['.d.ts$'],
    clearMocks: true,
    displayName: pkg.name,
    extensionsToTreatAsEsm: ['.ts', '.tsx'],
    globals: {
      'ts-jest': {
        isolatedModules: true,
        useESM: true,
      },
    },
    moduleNameMapper,
    passWithNoTests: true,
    preset: 'ts-jest',
    resetMocks: true,
    restoreMocks: true,
    setupFilesAfterEnv,
    snapshotFormat: {
      printBasicPrototype: false,
    },
    snapshotSerializers,
    // Use the jsdom environment if the project uses dom or webworker types. Otherwise default to
    // node.
    testEnvironment: lib.includes('dom') || lib.includes('webworker') ? 'jsdom' : 'node',
    testEnvironmentOptions: {
      // Prevent jest-environment-jsdom from using the browser field, which often leads to faux ESM.
      customExportConditions: ['node', 'node-addons'],
    },
    transform,
  };
}
