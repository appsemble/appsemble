import { setFixtureBase, setLogLevel } from '@appsemble/node-utils';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

setFixtureBase(__dirname);
setLogLevel(0);

expect.extend({ toMatchImageSnapshot });

jest.setTimeout(10_000);
