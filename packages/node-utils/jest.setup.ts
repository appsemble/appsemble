// Importing a module here will break mocks for that module. Only add imports from `./src/*` here
// that are strictly necessary.
import { setLogLevel } from './src/logger';
import { setFixtureBase } from './src/testFixtures';

setFixtureBase(__dirname);
setLogLevel(0);
