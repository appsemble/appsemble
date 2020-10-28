import { setLogLevel } from '@appsemble/node-utils';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

setLogLevel(0);

expect.extend({ toMatchImageSnapshot });

jest.setTimeout(10_000);
