import { setFixtureBase, setLogLevel } from '@appsemble/node-utils';
// eslint-disable-next-line import/no-extraneous-dependencies
import axiosSnapshotSerializer, { setResponseTransformer } from 'jest-axios-snapshot';
// https://vitest.dev/guide/snapshot.html#image-snapshots
// eslint-disable-next-line import/no-extraneous-dependencies
import { toMatchImageSnapshot } from 'jest-image-snapshot';
// eslint-disable-next-line import/no-extraneous-dependencies
import { expect } from 'vitest';

setFixtureBase(import.meta);
setLogLevel(0);

expect.extend({ toMatchImageSnapshot });

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

// @ts-expect-error The type definitions are incompatible, but this is fine.
expect.addSnapshotSerializer(axiosSnapshotSerializer);
