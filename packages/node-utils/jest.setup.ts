// Importing a module here will break mocks for that module. Only add imports from `./src/*` here
// that are strictly necessary.
import { setLogLevel } from './logger.js';
import { setFixtureBase } from './testFixtures.js';

setFixtureBase(__dirname);
setLogLevel(0);
