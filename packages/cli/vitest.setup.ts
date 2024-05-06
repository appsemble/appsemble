import { CREDENTIALS_ENV_VAR, setFixtureBase, setLogLevel } from '@appsemble/node-utils';

setFixtureBase(import.meta);
delete process.env[CREDENTIALS_ENV_VAR];
setLogLevel(0);
