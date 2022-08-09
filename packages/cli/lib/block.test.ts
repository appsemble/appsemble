import { resolveFixture } from '@appsemble/node-utils';
import concat from 'concat-stream';

import { makePayload } from './block.js';

describe('makePayload', () => {
  it('should create a form-data payload', async () => {
    const payload = await makePayload({
      webpack: 'webpack.config',
      name: '@org/block',
      output: 'output',
      version: '1.2.3',
      dir: resolveFixture('makePayload/no-icon'),
      parameters: { type: 'object' },
      actions: { onClick: {} },
      events: { listen: { test: {} } },
    });
    const boundary = payload.getBoundary();
    const buffer = await new Promise((resolve) => {
      payload.pipe(concat(resolve));
    });
    expect(String(buffer)).toBe(`--${boundary}\r
Content-Disposition: form-data; name="actions"\r
\r
{"onClick":{}}\r
--${boundary}\r
Content-Disposition: form-data; name="events"\r
\r
{"listen":{"test":{}}}\r
--${boundary}\r
Content-Disposition: form-data; name="name"\r
\r
@org/block\r
--${boundary}\r
Content-Disposition: form-data; name="parameters"\r
\r
{"type":"object"}\r
--${boundary}\r
Content-Disposition: form-data; name="version"\r
\r
1.2.3\r
--${boundary}\r
Content-Disposition: form-data; name="files"; filename="block.js"\r
Content-Type: application/javascript\r
\r
export const string = 'no-icon';
\r
--${boundary}--\r
`);
  });

  it('should include an icon if one is present', async () => {
    const payload = await makePayload({
      webpack: 'webpack.config',
      name: '@org/block',
      output: 'output',
      version: '1.2.3',
      dir: resolveFixture('makePayload/with-icon'),
      parameters: {},
      actions: {},
      events: {},
    });
    const boundary = payload.getBoundary();
    const buffer = await new Promise((resolve) => {
      payload.pipe(concat(resolve));
    });
    expect(String(buffer)).toBe(`--${boundary}\r
Content-Disposition: form-data; name="actions"\r
\r
{}\r
--${boundary}\r
Content-Disposition: form-data; name="events"\r
\r
{}\r
--${boundary}\r
Content-Disposition: form-data; name="name"\r
\r
@org/block\r
--${boundary}\r
Content-Disposition: form-data; name="parameters"\r
\r
{}\r
--${boundary}\r
Content-Disposition: form-data; name="version"\r
\r
1.2.3\r
--${boundary}\r
Content-Disposition: form-data; name="icon"; filename="icon.svg"\r
Content-Type: image/svg+xml\r
\r
<?xml version="1.0" standalone="no"?>
<svg />
\r
--${boundary}\r
Content-Disposition: form-data; name="files"; filename="block.js"\r
Content-Type: application/javascript\r
\r
export const string = 'with-icon';
\r
--${boundary}--\r
`);
  });
});
