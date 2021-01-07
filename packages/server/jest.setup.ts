import { formData, setFixtureBase, setLogLevel } from '@appsemble/node-utils';
import { request } from 'axios-test-instance';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

request.interceptors.request.use(formData);

setFixtureBase(__dirname);
setLogLevel(0);

expect.extend({ toMatchImageSnapshot });

jest.setTimeout(10_000);
