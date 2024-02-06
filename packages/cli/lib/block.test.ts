import { resolveFixture } from '@appsemble/node-utils';
import concat from 'concat-stream';
import { describe, expect, it } from 'vitest';

import { makeProjectPayload } from './project.js';

describe('makeProjectPayload', () => {
  it('should create a form-data payload', async () => {
    const payload = await makeProjectPayload({
      webpack: 'webpack.config',
      name: '@org/block',
      output: 'output',
      version: '1.2.3',
      dir: resolveFixture('makeProjectPayload/no-icon'),
    });
    const [formData] = payload;
    const boundary = formData.getBoundary();
    const buffer = await new Promise((resolve) => {
      formData.pipe(concat(resolve));
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
{"$schema":"http://json-schema.org/draft-07/schema#","type":"object","properties":{"type":{"type":"object"}},"required":["type"],"additionalProperties":false}\r
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
    const payload = await makeProjectPayload({
      webpack: 'webpack.config',
      name: '@org/block',
      output: 'output',
      version: '1.2.3',
      dir: resolveFixture('makeProjectPayload/with-icon'),
    });
    const [formData] = payload;
    const boundary = formData.getBoundary();
    const buffer = await new Promise((resolve) => {
      formData.pipe(concat(resolve));
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
{"$schema":"http://json-schema.org/draft-07/schema#","type":"object","properties":{"type":{"type":"object"}},"required":["type"],"additionalProperties":false}\r
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
