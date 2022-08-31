import { setFixtureBase, setLogLevel } from '@appsemble/node-utils';
import { setResponseTransformer } from 'jest-axios-snapshot';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

setFixtureBase(import.meta);
setLogLevel(0);

expect.extend({ toMatchImageSnapshot });

import.meta.jest.setTimeout(10_000);

setResponseTransformer(
  ({
    headers: {
      'accept-ranges': acceptRanges,
      connection,
      'content-length': contentLength,
      date,
      vary,
      ...headers
    },
    ...response
  }) => ({
    ...response,
    headers,
  }),
);
