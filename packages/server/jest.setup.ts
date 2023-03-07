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
      'access-control-allow-origin': accessControlAllowOrigin,
      connection,
      'content-length': contentLength,
      date,
      'keep-alive': keepAlive,
      vary,
      ...headers
    },
    ...response
  }) => ({
    ...response,
    headers,
  }),
);
