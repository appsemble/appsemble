import { setLogLevel } from '@appsemble/node-utils';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

setLogLevel('info');

expect.extend({ toMatchImageSnapshot });

jest.setTimeout(10_000);
